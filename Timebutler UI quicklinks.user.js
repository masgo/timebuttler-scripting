// ==UserScript==
// @name         TimeButler Custom Link and Button Replacer
// @namespace    http://tampermonkey.net/
// @version      0.6
// @description  Adds custom links to the TimeButler navigation bar, replaces a specific button, and focuses on the search input on the Mitarbeiter page.
// @author       Gemini
// @match        https://app.timebutler.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- Helper function to extract user ID from URL ---
    function getUserIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        // Prioritize 'id' if both are present, or use 'tid'
        return params.get('id') || params.get('tid');
    }

    // --- Function to add custom links to the navbar ---
    function addCustomNavbarLinks() {
        // Find the target navigation element
        const navbarRight = document.querySelector('nav.navbar-static-top div.navbar-right.flex.items-center.h-full');

        if (navbarRight) {
            const userId = getUserIdFromUrl();

            // Define common classes for navbar links
            // Changed ml-4 to ml-6 for more spacing
            const linkClasses = 'ml-6 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500';

            // Create the "Mitarbeiter" link (always present)
            if (!document.getElementById('timebutler-custom-link-6')) {
                const mitarbeiterLink = document.createElement('a');
                mitarbeiterLink.href = 'https://app.timebutler.com/do?ha=user&ac=6';
                mitarbeiterLink.textContent = 'Mitarbeiter';
                mitarbeiterLink.id = 'timebutler-custom-link-6';
                mitarbeiterLink.className = linkClasses;
                navbarRight.prepend(mitarbeiterLink);
                console.log('TimeButler Custom Link "Mitarbeiter" added.');
            }

            // Add conditional links if a userId is found in the URL
            if (userId) {
                // Link for ha=user&ac=13
                if (!document.getElementById('timebutler-custom-link-13')) {
                    const link13 = document.createElement('a');
                    link13.href = `https://app.timebutler.com/do?ha=user&ac=13&id=${userId}`;
                    link13.title = 'Weitere Details'; // Tooltip for the button
                    link13.id = 'timebutler-custom-link-13';
                    link13.className = linkClasses;

                    const icon13 = document.createElement('i');
                    icon13.className = 'fa fa-info-circle fa-fw-btn'; // Using info-circle icon
                    link13.appendChild(icon13);
                    link13.appendChild(document.createTextNode(' Details')); // Text next to icon

                    // Prepend this link before the "Mitarbeiter" link to maintain order
                    const mitarbeiterLink = document.getElementById('timebutler-custom-link-6');
                    if (mitarbeiterLink) {
                        mitarbeiterLink.after(link13);
                    } else {
                        navbarRight.prepend(link13); // Fallback if Mitarbeiter link not found
                    }
                    console.log(`TimeButler Custom Link "Details" (ID: ${userId}) added.`);
                }

                // Link for ha=user&ac=9
                if (!document.getElementById('timebutler-custom-link-9')) {
                    const link9 = document.createElement('a');
                    link9.href = `https://app.timebutler.com/do?ha=user&ac=9&id=${userId}`;
                    link9.title = 'Gehaltsdaten (Original)'; // Tooltip for the button
                    link9.id = 'timebutler-custom-link-9';
                    link9.className = linkClasses;

                    const icon9 = document.createElement('i');
                    icon9.className = 'fa fa-user fa-fw-btn'; // Using user icon
                    link9.appendChild(icon9);
                    link9.appendChild(document.createTextNode(' Profil')); // Text next to icon

                    // Prepend this link before the ha=user&ac=13 link to maintain order
                    const link13 = document.getElementById('timebutler-custom-link-13');
                    if (link13) {
                        link13.after(link9);
                    } else {
                        // If link13 not found, try after Mitarbeiter link
                        const mitarbeiterLink = document.getElementById('timebutler-custom-link-6');
                        if (mitarbeiterLink) {
                            mitarbeiterLink.after(link9);
                        } else {
                             navbarRight.prepend(link9); // Fallback if no specific anchor
                        }
                    }
                    console.log(`TimeButler Custom Link "Profil" (ID: ${userId}) added.`);
                }
            }
        } else {
            console.log('Navbar target element for custom links not found.');
        }
    }

    // --- Function to replace the "Gehaltsdaten" button ---
    function replaceSalaryButton() {
        // Find all "Gehaltsdaten" buttons.
        const salaryButtons = document.querySelectorAll('a.btn.btn-info.btn-xs.btn-flat[title="Gehaltsdaten"][href*="ha=user&ac=9&id="]');

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
                const newHref = `https://app.timebutler.com/do?ha=vac&ac=15&tid=${userId}`;

                // Create the new button element
                const newButton = document.createElement('a');
                newButton.href = newHref;
                newButton.title = 'Kalenderansicht'; // New title for the button
                // Copy classes from the old button to maintain styling
                newButton.className = oldButton.className;

                // Create the new icon element
                const newIcon = document.createElement('i');
                newIcon.className = 'fa fa-calendar-o'; // New icon class
                // Add fa-fw-btn if it was present in the old icon, for consistent spacing
                if (oldButton.querySelector('i.fa-fw-btn')) {
                    newIcon.classList.add('fa-fw-btn');
                }

                // Append the new icon to the new button
                newButton.appendChild(newIcon);

                // Replace the old button with the new one
                oldButton.parentNode.replaceChild(newButton, oldButton);

                // Mark the new button as replaced to prevent re-processing
                newButton.dataset.replaced = 'true';

                console.log(`Replaced "Gehaltsdaten" button (ID: ${userId}) with "Kalenderansicht" button.`);
            } else {
                console.warn('Could not extract ID from "Gehaltsdaten" button href:', href);
            }
        });
    }

    // --- Function to focus on the search input on the Mitarbeiter page ---
    function focusSearchInput() {
        // Check if the current URL matches the Mitarbeiter page
        if (window.location.href.includes('do?ha=user&ac=6')) {
            const searchInput = document.getElementById('usrsearch');
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
            // Find the th element containing "Urlaubskonto"
            const urlaubskontoTh = document.querySelector('th[colspan="4"]');

            if (urlaubskontoTh && urlaubskontoTh.textContent.includes('Urlaubskonto')) {
                // Find the small tag inside the th
                const smallTag = urlaubskontoTh.querySelector('small');
                const detailsLink = smallTag ? smallTag.querySelector('a[href*="ha=user&ac=13"]') : null;

                if (smallTag && detailsLink) {
                    // Check if the calendar link already exists
                    if (document.getElementById('timebutler-calendar-link')) {
                        console.log('Calendar link already exists in Urlaubskonto section.');
                        return;
                    }

                    // Extract year and ID from the existing details link's href
                    const detailsHref = detailsLink.getAttribute('href');
                    const idMatch = detailsHref.match(/id=(\d+)/);

                    if (idMatch && idMatch[1] && yearMatch && yearMatch[1]) {
                        const userId = idMatch[1];
                        // Construct the new calendar link URL
                        const calendarHref = `https://app.timebutler.com/do?ha=vac&ac=15&id=${userId}`;

                        // Create the new link element
                        const calendarLink = document.createElement('a');
                        calendarLink.href = calendarHref;
                        calendarLink.title = 'Kalenderansicht';
                        calendarLink.id = 'timebutler-calendar-link';
                        // Use pull-right and ml-2 for consistent styling and spacing
                        calendarLink.className = 'pull-right ml-2';

                        // Create the icon
                        const calendarIcon = document.createElement('i');
                        calendarIcon.className = 'fa fa-calendar fa-fw-btn';
                        calendarLink.appendChild(calendarIcon);
                        calendarLink.appendChild(document.createTextNode(' Kalender')); // Text next to icon

                        // Insert the new link before the existing "Details" link within the small tag
                        smallTag.insertBefore(calendarLink, detailsLink);
                        console.log(`Added "Kalenderansicht" link (ID: ${userId}, Year: ${year}) to Urlaubskonto section.`);
                    } else {
                        console.warn('Could not extract ID or Year from "Details" link href for Calendar link:', detailsHref);
                    }
                } else {
                    console.log('Could not find small tag or Details link in Urlaubskonto section.');
                }
            } else {
                console.log('Urlaubskonto (YYYY) th element not found on this page.');
            }
        }
    }
    
    // --- Main execution logic ---
    // Use a MutationObserver to watch for changes in the DOM,
    // in case elements are loaded dynamically after initial DOMContentLoaded.
    const observer = new MutationObserver((mutations, obs) => {
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
            addCustomNavbarLinks();
            replaceSalaryButton();
            focusSearchInput(); // Call focus function on DOMContentLoaded
            addCalendarLinkToVacationAccount(); 
        });
    } else {
        addCustomNavbarLinks();
        replaceSalaryButton();
        focusSearchInput(); // Call focus function if DOM is already ready
        addCalendarLinkToVacationAccount(); 
    }
})();
