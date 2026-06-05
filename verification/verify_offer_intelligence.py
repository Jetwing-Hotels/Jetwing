import asyncio
from playwright.async_api import async_playwright
import os

async def verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={'width': 1440, 'height': 1200})

        # Navigate to the guests page with recommendations view active
        await page.goto('http://localhost:3000/guests?view=recommendations')
        await asyncio.sleep(5)  # Wait for load

        # Capture the initial dashboard with AI Section and Campaign Table
        await page.screenshot(path='verification/offer_intelligence_dashboard.png', full_page=True)
        print("Captured dashboard screenshot.")

        # Click "Generate Recommendations" in the AI section on dashboard
        await page.click('text="Generate Recommendations"')
        await asyncio.sleep(3) # Wait for "loading" and step transition

        # Capture AI Recommendations results step
        await page.screenshot(path='verification/offer_intelligence_results.png')
        print("Captured AI results screenshot.")

        # Click "View Details" on the first recommendation card
        await page.click('text="👁 View Details"')
        await asyncio.sleep(2)
        await page.screenshot(path='verification/offer_intelligence_details_modal.png')
        print("Captured details modal screenshot.")

        # Close browser
        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify())
