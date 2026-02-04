# Finding Book Covers

This document provides tools and methods for finding missing book covers.

## Books Currently Missing Covers

### 2017
1. **Saltwater Buddha: A Surfer's Quest to Find Zen on the Sea** by Jaimal Yogis
2. **The Credibility Code** by Cara Hale Alter (ISBN: 9780985265601)
3. **Positive Discipline** by Jane Nelsen

### 2019
4. **IN WAVES.** by AJ. DUNGO (ISBN: 9781910620304)
5. **The Arab of the Future 3** by Riad Sattouf (ISBN: 9781627793537)
6. **My Midsummer Morning** by Alastair Humphreys (ISBN: 9780008331825)
7. **Darhan 2 : Les chemins de la guerre** by Sylvain Hotte (ISBN: 9782895496670)

### 2020
8. **Board** by David C. Flanagan (ISBN: 1905916949)

### 2021
9. **Le Syndrome de Palo Alto: roman** by Loïc Hecht (ISBN: 9782756113067)

### 2022
10. **Five Rules for Rebellion** by Sophie Walker (ISBN: 1785786032)

### 2023
11. **L'homme qui marche** by Jirō Taniguchi (ISBN: 9782203093805)

### 2024
12. **L'incroyable mademoiselle Bang !** by Yoon-sun Park (ISBN: 9782808502115)

### 2026
13. **American Tiger** by Adam Skolnick (ISBN: 9781544549859)

## Manual Cover Sources

### 1. Amazon
Search for the book on Amazon and right-click on the cover image, then select "Copy image address"
- Amazon.com: https://www.amazon.com/
- Amazon.fr: https://www.amazon.fr/ (for French books)

### 2. Goodreads
- Search: https://www.goodreads.com/search?q=TITLE
- Right-click the cover and copy image URL

### 3. Google Books
- Search: https://books.google.com/
- Covers are often high quality

### 4. Publishers' Websites
For French books especially, check:
- Éditions Casterman
- Dargaud
- Other French publishers

### 5. ISBN Search Services
- https://isbnsearch.org/
- https://www.librarything.com/

## Python Scripts Available

### 1. find_covers.py (Amazon/Goodreads method)
Uses the Calibre-based approach to search Goodreads for Kindle ASINs:

```bash
python3 scripts/find_covers.py \
  --title "Book Title" \
  --author "Author Name" \
  --isbn13 "9781234567890"
```

**Note**: Requires `lxml` package: `pip3 install lxml`

### 2. simple_cover_finder.py (Multi-source check)
Checks multiple sources and validates that images are real (not placeholders):

```bash
python3 scripts/simple_cover_finder.py \
  --title "Book Title" \
  --author "Author Name" \
  --isbn "1234567890" \
  --isbn13 "9781234567890"
```

## How to Add Covers

Once you find a cover URL, update the corresponding YAML file in `data/books/`:

```yaml
- title: Book Title
  author: Author Name
  isbn13: "9781234567890"
  cover_url: "https://example.com/cover.jpg"  # Add or update this line
```

The covers will automatically appear on your books page after Hugo rebuilds.

## Cover Requirements

- **Format**: JPG, PNG, or WebP
- **Minimum size**: At least 300px wide for good quality
- **Aspect ratio**: Ideally 2:3 (standard book cover ratio)
- **Accessibility**: Publicly accessible URL (no authentication required)

## Fallback Design

Books without `cover_url` will display a fallback design showing:
- Book title
- Author name
- Rating on hover

This is intentional and provides a clean, consistent look while you find covers.
