#!/usr/bin/env python3
"""
Find real book covers (not placeholders)
"""

import urllib.error
import urllib.request


def check_url_valid(url):
    """Check if URL returns valid, non-placeholder image"""
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

        # Real covers are usually > 10KB
        if "image" in content_type and content_length > 10000:
            return True, content_length
    except Exception:
        pass
    return False, 0


books = [
    {
        "title": "IN WAVES",
        "author": "AJ. DUNGO",
        "isbn": "1910620300",
        "isbn13": "9781910620304",
        "file": "2019.yaml",
    },
    {
        "title": "The Arab of the Future 3",
        "author": "Riad Sattouf",
        "isbn": "",
        "isbn13": "9781627793537",
        "file": "2019.yaml",
    },
    {
        "title": "My Midsummer Morning",
        "author": "Alastair Humphreys",
        "isbn": "0008331820",
        "isbn13": "9780008331825",
        "file": "2019.yaml",
    },
    {
        "title": "Darhan 2",
        "author": "Sylvain Hotte",
        "isbn": "2895496676",
        "isbn13": "9782895496670",
        "file": "2019.yaml",
    },
    {
        "title": "Le Syndrome de Palo Alto",
        "author": "Loïc Hecht",
        "isbn": "2756113069",
        "isbn13": "9782756113067",
        "file": "2021.yaml",
    },
    {
        "title": "L'homme qui marche",
        "author": "Jirō Taniguchi",
        "isbn": "2203093803",
        "isbn13": "9782203093805",
        "file": "2023.yaml",
    },
    {
        "title": "L'incroyable mademoiselle Bang",
        "author": "Yoon-sun Park",
        "isbn": "2808502117",
        "isbn13": "9782808502115",
        "file": "2024.yaml",
    },
    {
        "title": "American Tiger",
        "author": "Adam Skolnick",
        "isbn": "1544549857",
        "isbn13": "9781544549859",
        "file": "2026.yaml",
    },
    {
        "title": "The Credibility Code",
        "author": "Cara Hale Alter",
        "isbn": "0985265604",
        "isbn13": "9780985265601",
        "file": "2017.yaml",
    },
    {
        "title": "Board",
        "author": "David C. Flanagan",
        "isbn": "1905916949",
        "isbn13": "",
        "file": "2020.yaml",
    },
    {
        "title": "Five Rules for Rebellion",
        "author": "Sophie Walker",
        "isbn": "1785786032",
        "isbn13": "",
        "file": "2022.yaml",
    },
    {
        "title": "Saltwater Buddha",
        "author": "Jaimal Yogis",
        "isbn": "",
        "isbn13": "",
        "file": "2017.yaml",
    },
    {
        "title": "Positive Discipline",
        "author": "Jane Nelsen",
        "isbn": "",
        "isbn13": "",
        "file": "2017.yaml",
    },
]

print("🔍 Finding real book covers...\n")
found = []

for book in books:
    print(f"📚 {book['title']}")
    cover_found = False

    # Try multiple Amazon endpoints
    amazon_endpoints = [
        "https://images-na.ssl-images-amazon.com/images/P/{}.01.LZZZZZZZ.jpg",
        "https://m.media-amazon.com/images/P/{}.01._SCLZZZZZZZ_SX500_.jpg",
        "https://m.media-amazon.com/images/I/{}.jpg",
    ]

    for isbn_val in [book["isbn13"], book["isbn"]]:
        if not isbn_val or cover_found:
            continue

        for endpoint in amazon_endpoints:
            url = endpoint.format(isbn_val)
            valid, size = check_url_valid(url)
            if valid:
                print(f"   ✅ Found: {url} ({size:,} bytes)")
                found.append({"title": book["title"], "file": book["file"], "url": url})
                cover_found = True
                break

    if not cover_found:
        print(f"   ❌ No cover found")
    print()

print("\n" + "=" * 60)
print(f"✅ Found {len(found)} covers out of {len(books)} books")
print("=" * 60)

if found:
    print("\n📝 To update, add these URLs to the YAML files:")
    for item in found:
        print(f"\n{item['file']}: {item['title']}")
        print(f"  cover_url: {item['url']}")
