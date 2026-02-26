/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'thumbs.dreamstime.com' },
      { protocol: 'https', hostname: 'i0.wp.com' },
      { protocol: 'https', hostname: 'media.gettyimages.com' },
      { protocol: 'https', hostname: 'static.vecteezy.com' },
      { protocol: 'https', hostname: 'www.adventuretreks.com' },
      { protocol: 'https', hostname: 'www.outdooreducationcenter.org' },
      { protocol: 'https', hostname: 'tillyslifecenter.org' },
    ],
  },
};

module.exports = nextConfig;
