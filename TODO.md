

## DNS / SSL Setup (TODO)

### Cloudflare Proxy (when ready for production)
- Domain: pathfinderoutdoor.org
- Go to Cloudflare DNS settings
- Enable orange proxy icon for:
  - @ (root) -> 66.179.138.31
  - www -> 66.179.138.31
- SSL is automatic with Cloudflare proxy

### Current State
- Dev server running on http://66.179.138.31:3000
- Nginx reverse proxy configured but not active

