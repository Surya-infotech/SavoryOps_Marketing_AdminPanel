/**
 * Path prefixes that should mark a sidebar NavLink active (list + add/edit/detail routes).
 * Keys match AdminNavbar `to` paths.
 */
const NAV_ACTIVE_PREFIXES = {
    '/Home/Dashboard': ['/Home/Dashboard', '/Home/EmployeeDashboard'],
    '/Home/EmployeeDashboard': ['/Home/EmployeeDashboard', '/Home/Dashboard'],
    '/Support/WhiteLabel': ['/Support/WhiteLabel'],
    '/Support/ContactUs': ['/Support/ContactUs'],
    '/Support/Subscribers': ['/Support/Subscribers'],
    '/System/Setting': ['/System/Setting', '/System/Setting/AddFiscalYear', '/System/Setting/EditFiscalYear'],
    '/User/Employee': ['/User/Employee', '/User/AddEmployee', '/User/EditEmployee', '/User/EmployeeOverview'],
};

const matchesPrefix = (pathname, prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`);

/**
 * @param {string} navPath - AdminNavbar NavLink `to` value
 * @param {string} pathname - current location.pathname
 */
export function isAdminNavLinkActive(navPath, pathname) {
    const prefixes = NAV_ACTIVE_PREFIXES[navPath];
    if (prefixes) {
        return prefixes.some((prefix) => matchesPrefix(pathname, prefix));
    }
    return matchesPrefix(pathname, navPath);
}