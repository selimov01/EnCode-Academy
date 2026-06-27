from playwright.sync_api import sync_playwright
import json

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('http://127.0.0.1:8000/index.html', wait_until='networkidle')
    button = page.locator('.course-action-btn[data-course-id="backend"]').first
    button.click()
    page.wait_for_timeout(500)
    text = button.text_content()
    saved = page.evaluate('() => localStorage.getItem("savedCourses")')
    browser.close()
    print(json.dumps({'text': text, 'saved': saved}))
