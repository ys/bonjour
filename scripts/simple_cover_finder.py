#!/usr/bin/env python3
"""
Simple script to find book covers from multiple sources
"""

import sys
import urllib.error
import urllib.request


def check_url(url):
    """Check if a URL returns a valid image"""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        response = urllib.request.urlopen(req, timeout=10)
        content_type = response.headers.get("Content-Type", "")
        content_length = int(response.headers.get("Content-Length", 0))

        # Check if it's an image and not a tiny placeholder
        if "image" in content_type and content_length > 5000:
            return True
    except (urllib.error.URLError, urllib.error.HTTPError, Exception):
        pass
    return False


def find_cover_urls(isbn, isbn13, title, author):
    """Try various cover sources"""
    urls = []

    # Try Open Library with different sizes
    if isbn13:
        ol_urls = [
            f"https://covers.openlibrary.org/b/isbn/{isbn13}-L.jpg",
            f"https://covers.openlibrary.org/b/isbn/{isbn13}-M.jpg",
        ]
        for url in ol_urls:
            if check_url(url):
                urls.append(url)
                break

    if isbn:
        ol_urls = [
            f"https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg",
            f"https://covers.openlibrary.org/b/isbn/{isbn}-M.jpg",
        ]
        for url in ol_urls:
            if check_url(url):
                urls.append(url)
                break

    # Try Google Books
    if isbn13:
        gb_url = f"https://books.google.com/books/content?id=&printsec=frontcover&img=1&zoom=1&isbn={isbn13}"
        if check_url(gb_url):
            urls.append(gb_url)

    # Try ISBN Search (covers database)
    if isbn13:
        isbndb_url = f"https://isbnsearch.org/isbn/{isbn13}"
        # Note: This is a page URL, not direct image, but could be scraped

    return urls


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Find book cover URLs")
    parser.add_argument("--title", help="Book title")
    parser.add_argument("--author", help="Book author")
    parser.add_argument("--isbn", help="ISBN")
    parser.add_argument("--isbn13", help="ISBN-13")

    args = parser.parse_args()

    urls = find_cover_urls(args.isbn, args.isbn13, args.title, args.author)

    if urls:
        print(f"Found {len(urls)} cover URL(s):")
        for url in urls:
            print(url)
    else:
        print("No cover URLs found")
        sys.exit(1)
