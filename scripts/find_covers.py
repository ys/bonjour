import re
from urllib.request import urlopen, Request
from urllib.parse import urljoin, quote_plus
from contextlib import closing
from lxml.html import fromstring
import logging
import sys
import getopt

def is_kindle_asin(value):
    return value and len(value) == 10 and value.startswith('B')

goodreads_url = 'https://www.goodreads.com'

def browser_open(url):
    """Simple browser simulation"""
    req = Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    return urlopen(req)

def search_edition_goodreads(log, query):
    edition_url = None

    search_url = urljoin(goodreads_url, '/search?q=' + quote_plus(query))
    log.info('Searching Goodreads for book: %s' % search_url)
    with closing(browser_open(search_url)) as response:
        doc = fromstring(response.read())
        books = doc.xpath('//*[@itemtype="http://schema.org/Book"]')
        if books:
            book = books[0]
            url = book.xpath('.//*[@itemprop="url"]/@href')
            if url:
                edition_url = url[0]

    if edition_url:
        edition_url = urljoin(goodreads_url, edition_url)
    return edition_url

def search_asins_goodreads(log, edition):
    try:
        number = int(edition)
        edition_url = '/book/show/' + str(number)
    except ValueError:
        edition_url = edition
    edition_url = urljoin(goodreads_url, edition_url)

    # parse the details page and get the link to list all editions
    log.info('Fetching book details: %s' % edition_url)
    with closing(browser_open(edition_url)) as response:
        doc = fromstring(response.read())
        editions_url = doc.xpath('//div[@class="otherEditionsLink"]/a/@href')
        if editions_url:
            editions_url = editions_url[0]
        else:
            return set()
        editions_url = urljoin(goodreads_url, editions_url)

    # list all Kindle editions of the book
    editions_url = urljoin(editions_url, '?expanded=true&filter_by_format=Kindle+Edition&per_page=100')
    log.info('Fetching Kindle editions: %s' % editions_url)
    with closing(browser_open(editions_url)) as response:
        doc = fromstring(response.read())
        asins = set()
        for value in doc.xpath('//*[@class="dataValue"]//text()'):
            value = value.strip()
            if is_kindle_asin(value):
                asins.add(value)
        return asins

def get_cover_urls(log, title, authors, identifiers, timeout):
    sources = frozenset([
        'https://ec2.images-amazon.com/images/P/{0}.01.MAIN._SCRM_.jpg',
    ])
    urls = set()
    asins = set()

    # check for ASINs identifiers first
    for id, value in identifiers.items():
        is_asin   = id == 'asin' or id == 'mobi-asin' or id.startswith('amazon')
        is_kindle = is_kindle_asin(value)
        if is_asin and is_kindle:
            log.info('ASIN present in metadata: %s' % value)
            asins.add(value)

    # otherwise search Goodreads to find Kindle editions
    if not asins:
        isbn = identifiers.get('isbn13') or identifiers.get('isbn')
        if isbn:
            log.info('ISBN present in metadata: %s', isbn)
            query = isbn
        else:
            log.info('ISBN not present in metadata')
            query = ''
            if title:
                query = title
                if authors and authors[0]:
                    query = query + ' ' + authors[0]

        if query:
            try:
                edition = search_edition_goodreads(log, query)
                if edition:
                    asins = search_asins_goodreads(log, edition)
            except Exception as e:
                log.error('Error searching Goodreads: %s' % str(e))

    # now convert all ASINs into the download URLs
    if asins:
        for asin in asins:
            for source in sources:
                url = source.format(asin)
                urls.add(url)
    return list(urls)

if __name__ == "__main__":
    title = None
    author = None
    identifiers = {
        'asin': None,
        'goodreads': None,
        'isbn': None,
        'isbn13': None,
    }

    opts, args = getopt.gnu_getopt(sys.argv, '', ['title=', 'author=', 'isbn=', 'isbn13=', 'asin=', 'goodreads='])
    for o, a in opts:
        if o == '--asin':
            identifiers['asin'] = a
        elif o == '--author':
            author = a
        elif o == '--goodreads':
            identifiers['goodreads'] = a
        elif o == '--isbn':
            identifiers['isbn'] = a
        elif o == '--isbn13':
            identifiers['isbn13'] = a
        elif o == '--title':
            title = a

    logging.basicConfig(stream=sys.stdout, level=logging.INFO)
    log = logging.getLogger()
    urls = get_cover_urls(log, title, [author] if author else [], identifiers, 60)
    for url in urls:
        print(url)
