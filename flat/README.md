# Hardcover Books Sync

This script fetches your reading data from Hardcover.app and generates YAML files for your books.

## Features

- Fetches all your books from Hardcover via GraphQL API
- Organizes books by year (when you finished reading them)
- Keeps currently reading books in `current.yaml`
- **Automatically searches for missing book covers** from Amazon when Hardcover doesn't provide one

## Automatic Cover Finding

When a book doesn't have a cover URL from Hardcover, the script will:

1. Try multiple Amazon image endpoints using the book's ISBN/ISBN13
2. Verify the image is a real cover (not a placeholder)
3. Add the cover URL to the book data automatically

This means covers will be filled in over time as books are synced!

## Running Locally

```bash
# Set your Hardcover API token (get it from https://hardcover.app/account/api)
export HARDCOVER_TOKEN="your_token_here"

# Run the script
deno run --allow-net --allow-read --allow-write --allow-env flat/hardcover.ts
```

## GitHub Action

The workflow runs every 6 hours and automatically:
- Fetches new books from Hardcover
- Searches for missing covers
- Commits any changes back to the repository

See `.github/workflows/books.yaml` for the configuration.
