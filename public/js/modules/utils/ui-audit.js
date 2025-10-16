/**
 * UI Consistency Audit Module
 * Ensures all pages follow consistent UI/UX patterns
 */

const UIConsistencyAudit = {
    /**
     * Required elements for each page
     */
    requiredElements: {
        html: ['head', 'body'],
        head: ['title', 'meta[charset]', 'meta[name="viewport"]', 'link[rel="stylesheet"]'],
        body: ['.sidebar', '.main-content', '.topbar', 'main'],
        sidebar: ['.logo', '.nav-menu', '.sidebar-footer'],
        topbar: ['.menu-toggle', '.page-title', '.topbar-right'],
        main: ['[role="main"]']
    },

    /**
     * Required attributes for accessibility
     */
    requiredAttributes: {
        'nav': ['aria-label'],
        'button': ['aria-label'],
        'input': ['aria-label'],
        'select': ['aria-label'],
        'textarea': ['aria-label'],
        'img': ['alt'],
        'a': ['aria-label'],
        'form': ['aria-label']
    },

    /**
     * Audit a single page
     */
    auditPage(pagePath) {
        const issues = [];

        try {
            // This would be called from a Node.js context or browser
            // For now, we'll create a checklist approach
            console.log(`Auditing page: ${pagePath}`);
            return this.generateAuditChecklist(pagePath);
        } catch (error) {
            issues.push({
                type: 'error',
                message: `Failed to audit page ${pagePath}: ${error.message}`,
                severity: 'high'
            });
        }

        return issues;
    },

    /**
     * Generate audit checklist for a page
     */
    generateAuditChecklist(pagePath) {
        const checklist = {
            page: pagePath,
            issues: [],
            score: 0,
            maxScore: 0
        };

        // Check HTML structure
        Object.entries(this.requiredElements).forEach(([parent, children]) => {
            children.forEach(child => {
                checklist.maxScore += 10;
                checklist.issues.push({
                    type: 'structure',
                    element: child,
                    parent: parent,
                    message: `Ensure ${child} exists in ${parent}`,
                    severity: 'medium',
                    checked: false
                });
            });
        });

        // Check accessibility attributes
        Object.entries(this.requiredAttributes).forEach(([element, attrs]) => {
            attrs.forEach(attr => {
                checklist.maxScore += 5;
                checklist.issues.push({
                    type: 'accessibility',
                    element: element,
                    attribute: attr,
                    message: `Ensure ${element} has ${attr} attribute`,
                    severity: 'high',
                    checked: false
                });
            });
        });

        // Additional checks
        const additionalChecks = [
            {
                type: 'performance',
                message: 'Page should use lazy loading for images',
                severity: 'low'
            },
            {
                type: 'seo',
                message: 'Page should have proper meta description',
                severity: 'medium'
            },
            {
                type: 'ux',
                message: 'Page should have consistent navigation',
                severity: 'high'
            },
            {
                type: 'responsive',
                message: 'Page should be mobile-friendly',
                severity: 'high'
            }
        ];

        additionalChecks.forEach(check => {
            checklist.maxScore += 10;
            checklist.issues.push({
                ...check,
                checked: false
            });
        });

        return checklist;
    },

    /**
     * Run audit on all pages
     */
    async auditAllPages() {
        const pages = [
            'index.html',
            'inventory.html',
            'products.html',
            'production.html',
            'orders.html',
            'suppliers.html',
            'customers.html',
            'reports.html',
            'qc-dashboard.html',
            'user-management.html',
            'roles.html'
        ];

        const results = [];

        for (const page of pages) {
            const result = this.auditPage(page);
            results.push(result);
        }

        return results;
    },

    /**
     * Generate consistency report
     */
    generateReport(results) {
        const report = {
            timestamp: new Date().toISOString(),
            totalPages: results.length,
            totalIssues: results.reduce((sum, r) => sum + r.issues.length, 0),
            issuesByType: {},
            issuesBySeverity: {},
            recommendations: []
        };

        // Analyze issues
        results.forEach(result => {
            result.issues.forEach(issue => {
                // Count by type
                report.issuesByType[issue.type] = (report.issuesByType[issue.type] || 0) + 1;

                // Count by severity
                report.issuesBySeverity[issue.severity] = (report.issuesBySeverity[issue.severity] || 0) + 1;
            });
        });

        // Generate recommendations
        if (report.issuesBySeverity.high > 0) {
            report.recommendations.push('High priority: Fix accessibility issues immediately');
        }

        if (report.issuesByType.structure > 0) {
            report.recommendations.push('Ensure all pages follow the standard HTML structure from template.html');
        }

        if (report.issuesByType.accessibility > 0) {
            report.recommendations.push('Add proper ARIA labels and accessibility attributes');
        }

        return report;
    },

    /**
     * Apply template to a page
     */
    applyTemplate(pagePath, pageTitle, pageContent) {
        const template = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageTitle} - Factory Inventory System</title>
    <link rel="stylesheet" href="/css/style.css?v=20251012">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <a href="#main-content" class="skip-link">Skip to main content</a>
</head>
<body>
    <!-- Sidebar -->
    <aside class="sidebar" id="sidebar" role="navigation" aria-label="Main navigation">
        <!-- Sidebar content from template -->
    </aside>

    <div class="main-content">
        <div class="topbar" role="banner">
            <button class="menu-toggle" onclick="toggleSidebar()" aria-label="Toggle sidebar menu">
                <i class="fas fa-bars"></i>
            </button>
            <h1 class="page-title">${pageTitle}</h1>
            <div class="topbar-right">
                <!-- Language switcher and notifications -->
            </div>
        </div>

        <main id="main-content" role="main" tabindex="-1">
            ${pageContent}
        </main>
    </div>

    <script src="/js/main.js?v=20251012"></script>
</body>
</html>`;

        return template;
    },

    /**
     * Validate page against template
     */
    validateAgainstTemplate(pageContent, templateContent) {
        const issues = [];

        // Check for required structural elements
        const requiredPatterns = [
            /<nav[^>]*aria-label/i,
            /<main[^>]*role="main"/i,
            /<button[^>]*aria-label/i,
            /<aside[^>]*role="navigation"/i,
            /skip-link/i
        ];

        requiredPatterns.forEach(pattern => {
            if (!pattern.test(pageContent)) {
                issues.push({
                    type: 'structure',
                    message: `Missing required accessibility element: ${pattern}`,
                    severity: 'high'
                });
            }
        });

        return issues;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIConsistencyAudit;
}