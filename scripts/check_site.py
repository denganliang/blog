import json
import pathlib
import re
import sys

ROOT = pathlib.Path('.')
HTML_FILES = sorted(ROOT.rglob('*.html'))
BASE = 'https://denganliang.com'
SCAN_FILE_SUFFIXES = {'.html', '.js', '.css'}
SCAN_EXCLUDE_PREFIXES = ('assets/vendor/',)
BLOCKED_CDN_RULES = (
    ('cdn.jsdelivr.net', re.compile(r'(?:https?:)?//(?:[^/]+\.)?cdn\.jsdelivr\.net', re.IGNORECASE)),
    ('unpkg.com', re.compile(r'(?:https?:)?//(?:[^/]+\.)?unpkg\.com', re.IGNORECASE)),
    ('cdnjs.cloudflare.com', re.compile(r'(?:https?:)?//(?:[^/]+\.)?cdnjs\.cloudflare\.com', re.IGNORECASE)),
    ('cdn.tailwindcss.com', re.compile(r'(?:https?:)?//(?:[^/]+\.)?cdn\.tailwindcss\.com', re.IGNORECASE)),
    ('maxcdn.bootstrapcdn.com', re.compile(r'(?:https?:)?//(?:[^/]+\.)?maxcdn\.bootstrapcdn\.com', re.IGNORECASE)),
)
LOCAL_VENDOR_REF_PATTERN = re.compile(r"[\"'](/assets/vendor/[^\"'?#]+)")


def route_from_path(path: pathlib.Path) -> str:
    posix = path.as_posix()
    if posix.endswith('index.html'):
        route = '/' + posix[:-len('index.html')]
        route = route.replace('//', '/')
        if not route.endswith('/'):
            route += '/'
        return route
    return '/' + posix


def check_search_index():
    target = ROOT / 'search-index.json'
    try:
        json.loads(target.read_text(encoding='utf-8'))
        return []
    except Exception as exc:
        return [f'search-index.json invalid: {exc}']


def check_html_tags():
    issues = []
    file_set = {f.as_posix() for f in HTML_FILES}

    for f in HTML_FILES:
        text = f.read_text(encoding='utf-8')
        route = route_from_path(f)
        expected_canonical = f'{BASE}{route}'

        canonical_match = re.search(r'<link\s+rel="canonical"\s+href="([^"]+)"\s*/?>', text)
        if not canonical_match:
            issues.append(f'{f.as_posix()}: missing canonical')
        else:
            canonical = canonical_match.group(1)
            if canonical != expected_canonical:
                issues.append(f'{f.as_posix()}: canonical mismatch ({canonical} != {expected_canonical})')

        og_url_match = re.search(r'<meta\s+property="og:url"\s+content="([^"]+)"\s*/?>', text)
        if og_url_match and og_url_match.group(1) != expected_canonical:
            issues.append(f'{f.as_posix()}: og:url mismatch ({og_url_match.group(1)} != {expected_canonical})')

        if f.as_posix().startswith('en/'):
            zh_path = f.as_posix()[3:]
            en_route = route
            zh_route = route_from_path(pathlib.Path(zh_path)) if zh_path in file_set else None
        else:
            en_path = f'en/{f.as_posix()}'
            zh_route = route
            en_route = route_from_path(pathlib.Path(en_path)) if en_path in file_set else None

        if zh_route and en_route:
            hreflangs = dict(re.findall(r'<link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)"\s*/?>', text))
            if hreflangs.get('zh') != zh_route:
                issues.append(f'{f.as_posix()}: hreflang zh mismatch')
            if hreflangs.get('en') != en_route:
                issues.append(f'{f.as_posix()}: hreflang en mismatch')
            if hreflangs.get('x-default') != zh_route:
                issues.append(f'{f.as_posix()}: hreflang x-default mismatch')

    return issues


def check_no_cdn_dependencies():
    issues = []

    for path in ROOT.rglob('*'):
        if not path.is_file() or path.suffix.lower() not in SCAN_FILE_SUFFIXES:
            continue

        posix = path.as_posix()
        if any(posix.startswith(prefix) for prefix in SCAN_EXCLUDE_PREFIXES):
            continue

        text = path.read_text(encoding='utf-8')
        for line_number, line in enumerate(text.splitlines(), start=1):
            for host, pattern in BLOCKED_CDN_RULES:
                if pattern.search(line):
                    issues.append(f'{posix}:{line_number}: blocked CDN dependency ({host})')
                    break

    return issues


def check_vendor_references_exist():
    issues = []

    for path in ROOT.rglob('*'):
        if not path.is_file() or path.suffix.lower() not in SCAN_FILE_SUFFIXES:
            continue

        posix = path.as_posix()
        if any(posix.startswith(prefix) for prefix in SCAN_EXCLUDE_PREFIXES):
            continue

        text = path.read_text(encoding='utf-8')
        for ref in LOCAL_VENDOR_REF_PATTERN.findall(text):
            target = ROOT / ref.lstrip('/')
            if not target.exists():
                issues.append(f'{posix}: missing local vendor file ({ref})')

    return issues


def main():
    issues = []
    issues.extend(check_search_index())
    issues.extend(check_html_tags())
    issues.extend(check_no_cdn_dependencies())
    issues.extend(check_vendor_references_exist())

    if issues:
        print('CHECK FAILED:')
        for issue in issues:
            print('-', issue)
        sys.exit(1)

    print(f'CHECK OK ({len(HTML_FILES)} html files)')


if __name__ == '__main__':
    main()
