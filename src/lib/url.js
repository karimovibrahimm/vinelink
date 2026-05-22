const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname)

// On localhost, profiles are served at /username (path-based routing)
// On production, profiles are served at username.vinelink.xyz (subdomain routing)
export const getProfileUrl = (username) => {
  if (!username) return '#'
  if (isLocalhost) return `${window.location.origin}/${username}`
  return `https://${username}.vinelink.xyz`
}

export const getProfileDisplayUrl = (username) => {
  if (!username) return ''
  if (isLocalhost) return `localhost/${username}`
  return `${username}.vinelink.xyz`
}
