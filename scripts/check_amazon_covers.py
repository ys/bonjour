#!/usr/bin/env python3
"""
Check for book covers directly from various sources
"""

import json
import urllib.error
import urllib.request


def check_url_valid(url):
    """Check if URL returns valid image"""
    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
            },
        )
        response = urllib.request.urlopen(req, timeout=10)
        content_type = response.headers.get("Content-Type", "")
        content_length = int(response.headers.get("Content-Length", 0))

        # Check if it's an image and larger than a placeholder
        if "image" in content_type and content_length > 1000:
            return True, content_length
    except Exception as e:
        pass
    return False, 0


books = [
    {
        "title": "IN WAVES",
        "author": "AJ. DUNGO",
        "isbn": "1910620300",
        "isbn13": "9781910620304",
    },
    {
        "title": "The Arab of the Future 3",
        "author": "Riad Sattouf",
        "isbn": "",
        "isbn13": "9781627793537",
    },
    {
        "title": "My Midsummer Morning",
        "author": "Alastair Humphreys",
        "isbn": "0008331820",
        "isbn13": "9780008331825",
    },
    {
        "title": "Darhan 2",
        "author": "Sylvain Hotte",
        "isbn": "2895496676",
        "isbn13": "9782895496670",
    },
    {
        "title": "Le Syndrome de Palo Alto",
        "author": "Loïc Hecht",
        "isbn": "2756113069",
        "isbn13": "9782756113067",
    },
    {
        "title": "L'homme qui marche",
        "author": "Jirō Taniguchi",
        "isbn": "2203093803",
        "isbn13": "9782203093805",
    },
    {
        "title": "L'incroyable mademoiselle Bang",
        "author": "Yoon-sun Park",
        "isbn": "2808502117",
        "isbn13": "9782808502115",
    },
    {
        "title": "American Tiger",
        "author": "Adam Skolnick",
        "isbn": "1544549857",
        "isbn13": "9781544549859",
    },
    {
        "title": "The Credibility Code",
        "author": "Cara Hale Alter",
        "isbn": "0985265604",
        "isbn13": "9780985265601",
    },
    {
        "title": "Board",
        "author": "David C. Flanagan",
        "isbn": "1905916949",
        "isbn13": "",
    },
    {
        "title": "Five Rules for Rebellion",
        "author": "Sophie Walker",
        "isbn": "1785786032",
        "isbn13": "",
    },
]

print("Checking cover URLs for missing books...\n")

for book in books:
    print(f"📚 {book['title']} by {book['author']}")
    found_cover = False

    # Try different sources
    sources = []

    # Open Library
    if book["isbn13"]:
        sources.append(
            (
                "Open Library (L)",
                f"https://covers.openlibrary.org/b/isbn/{book['isbn13']}-L.jpg",
            )
        )
    if book["isbn"]:
        sources.append(
            (
                "Open Library ISBN (L)",
                f"https://covers.openlibrary.org/b/isbn/{book['isbn']}-L.jpg",
            )
        )

    # Google Books
    if book["isbn13"]:
        sources.append(
            (
                "Google Books",
                f"http://books.google.com/books/content?id=&printsec=frontcover&img=1&zoom=1&isbn={book['isbn13']}",
            )
        )

    # Amazon Images (various endpoints)
    if book["isbn13"]:
        sources.append(
            (
                "Amazon (ISBN13)",
                f"https://images-na.ssl-images-amazon.com/images/P/{book['isbn13']}.01.LZZZZZZZ.jpg",
            )
        )
    if book["isbn"]:
        sources.append(
            (
                "Amazon (ISBN)",
                f"https://images-na.ssl-images-amazon.com/images/P/{book['isbn']}.01.LZZZZZZZ.jpg",
            )
        )

    for source_name, url in sources:
        valid, size = check_url_valid(url)
        if valid:
            print(f"   ✅ {source_name}: {url} ({size} bytes)")
            found_cover = True
            break

    if not found_cover:
        print(f"   ❌ No valid cover found")

    print()

print("\nDone!")
