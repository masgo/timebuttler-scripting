// ==UserScript==
// @name         TimeButler Custom Link and Button Replacer
// @namespace    http://tampermonkey.net/
// @version      0.8
// @description  Adds custom links to the TimeButler navigation bar, replaces a specific button, and focuses on the search input on the Mitarbeiter page.
// @author       Gemini + Cursor
// @match        https://app.timebutler.com/*
// @match        https://timebutler.de/*
// @match        https://www.timebutler.de/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const APP_ORIGIN = 'https://app.timebutler.com';

    // --- Helper function to extract user ID from URL ---
    function getUserIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        // Prioritize 'id' if both are present, or use 'tid'
        return params.get('id') || params.get('tid');
    }

    function runDomainSwitchIfNeeded() {
        const host = window.location.hostname;
        const isLegacyHost = host === 'timebutler.de' || host === 'www.timebutler.de';
        if (!isLegacyHost) return;

        // Avoid click loops.
        const key = 'tb_domain_switch_clicked';
        if (sessionStorage.getItem(key) === '1') return;

        const banner = document.getElementById('mainWarningMessage');
        if (!banner) return;

        const switchLink = banner.querySelector('a.relogin-to-app-dot-com[href]');
        if (!switchLink) return;

        sessionStorage.setItem(key, '1');
        switchLink.click();
    }

    function getTopbarTarget() {
        // New UI (3.0.0): <ul id="topbar-actions">...</ul>
        const topbarActions = document.getElementById('topbar-actions');
        if (topbarActions) return topbarActions;

        // Fallbacks for other layouts.
        return (
            document.querySelector('header.topbar .topbar-right') ||
            document.querySelector('nav.navbar-static-top .navbar-right') ||
            null
        );
    }

    function ensureTopbarItem({ id, href, text, title }) {
        const target = getTopbarTarget();
        if (!target) return false;

        if (document.getElementById(id)) return true;

        // If target is a <ul>, we inject <li><a/></li>, otherwise just <a/>.
        const isUl = target.tagName === 'UL';
        const link = document.createElement('a');
        link.href = href;
        link.textContent = text;
        if (title) link.title = title;
        link.id = id;

        if (isUl) {
            const li = document.createElement('li');
            li.id = `${id}__li`;
            li.appendChild(link);
            target.prepend(li);
        } else {
            // Old navbar fallback styling.
            const linkClasses = 'ml-6 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500';
            link.className = linkClasses;
            target.prepend(link);
        }

        return true;
    }

    // --- Function to add custom links to the navbar ---
    function addCustomNavbarLinks() {
        const userId = getUserIdFromUrl();

        ensureTopbarItem({
            id: 'timebutler-custom-link-6',
            href: `${APP_ORIGIN}/do?ha=user&ac=6`,
            text: 'Mitarbeiter',
            title: 'Mitarbeitende'
        });

        if (userId) {
            ensureTopbarItem({
                id: 'timebutler-custom-link-13',
                href: `${APP_ORIGIN}/do?ha=user&ac=13&id=${userId}`,
                text: 'Details',
                title: 'Weitere Details'
            });

            ensureTopbarItem({
                id: 'timebutler-custom-link-9',
                href: `${APP_ORIGIN}/do?ha=user&ac=9&id=${userId}`,
                text: 'Profil',
                title: 'Gehaltsdaten (Original)'
            });
        }
    }

    // --- Function to replace the "Gehaltsdaten" button ---
    function replaceSalaryButton() {
        // Find likely "Gehaltsdaten" buttons/links.
        // New UI may have different classes, so keep it flexible.
        const salaryButtons = document.querySelectorAll(
            'a[title="Gehaltsdaten"][href*="ha=user&ac=9&id="], a.btn[title="Gehaltsdaten"][href*="ha=user&ac=9&id="]'
        );

        salaryButtons.forEach(oldButton => {
            // Check if this specific button has already been replaced
            if (oldButton.dataset.replaced === 'true') {
                return; // Skip if already replaced
            }

            // Extract the ID from the old button's href
            const href = oldButton.getAttribute('href');
            const idMatch = href.match(/id=(\d+)/); // Regex to find 'id=' followed by digits

            if (idMatch && idMatch[1]) {
                const userId = idMatch[1];
                const newHref = `${APP_ORIGIN}/do?ha=vac&ac=15&tid=${userId}`;

                // Safer than replacing the whole element: just repoint the link and (if present) tweak the icon.
                oldButton.href = newHref;
                oldButton.title = 'Kalenderansicht';

                const icon = oldButton.querySelector('i.fa');
                if (icon) {
                    icon.className = 'fa fa-calendar-o' + (icon.classList.contains('fa-fw-btn') ? ' fa-fw-btn' : '');
                }

                oldButton.dataset.replaced = 'true';
            } else {
                console.warn('Could not extract ID from "Gehaltsdaten" button href:', href);
            }
        });
    }

    // --- Function to focus on the search input on the Mitarbeiter page ---
    function focusSearchInput() {
        // Check if the current URL matches the Mitarbeiter page
        if (window.location.href.includes('do?ha=user&ac=6')) {
            const searchInput =
                document.getElementById('usrsearch') ||
                document.querySelector('input[name="usrsearch"]') ||
                document.querySelector('input[type="search"]') ||
                document.querySelector('input[placeholder*="Suche"], input[placeholder*="Suchen"]');

            if (searchInput) {
                // Use a small timeout to ensure the element is fully ready for focus
                setTimeout(() => {
                    searchInput.focus();
                    console.log('Focused on search input on Mitarbeiter page.');
                }, 100); // 100ms delay
            } else {
                console.log('Search input element (#usrsearch) not found on Mitarbeiter page.');
            }
        }
    }

   // --- Function to add Calendar link to Urlaubskonto section ---
    function addCalendarLinkToVacationAccount() {
        // Check if we are on the specific user details page (ac=9)
        if (window.location.href.includes('do?ha=user&ac=9')) {
            if (document.getElementById('timebutler-calendar-link')) return;

            // Try to find a "Details" link which contains the user id.
            const detailsLink = document.querySelector('a[href*="ha=user&ac=13&id="]');
            if (!detailsLink) return;

            const detailsHref = detailsLink.getAttribute('href') || '';
            const idMatch = detailsHref.match(/id=(\d+)/);
            if (!idMatch?.[1]) return;

            const userId = idMatch[1];
            const calendarHref = `${APP_ORIGIN}/do?ha=vac&ac=15&tid=${userId}`;

            const calendarLink = document.createElement('a');
            calendarLink.href = calendarHref;
            calendarLink.title = 'Kalenderansicht';
            calendarLink.id = 'timebutler-calendar-link';
            calendarLink.className = 'ml-2';
            calendarLink.textContent = 'Kalender';

            // Insert near the details link (best-effort).
            detailsLink.parentElement?.insertBefore(calendarLink, detailsLink);
        }
    }
    
    // --- Main execution logic ---
    // Use a MutationObserver to watch for changes in the DOM,
    // in case elements are loaded dynamically after initial DOMContentLoaded.
    const observer = new MutationObserver((mutations, obs) => {
        runDomainSwitchIfNeeded();
        // Always try to add the links and replace buttons whenever DOM changes
        addCustomNavbarLinks();
        replaceSalaryButton();
        // Also try to focus the search input on relevant pages
        focusSearchInput();
        addCalendarLinkToVacationAccount();        
    });

    // Start observing the document body for child list changes and subtree changes
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Also, try to run the functions immediately in case the elements are already present
    // when the script runs (e.g., if the DOMContentLoaded event has already fired).
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            runDomainSwitchIfNeeded();
            addCustomNavbarLinks();
            replaceSalaryButton();
            focusSearchInput(); // Call focus function on DOMContentLoaded
            addCalendarLinkToVacationAccount(); 
        });
    } else {
        runDomainSwitchIfNeeded();
        addCustomNavbarLinks();
        replaceSalaryButton();
        focusSearchInput(); // Call focus function if DOM is already ready
        addCalendarLinkToVacationAccount(); 
    }
})();
