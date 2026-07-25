import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental:{
    staleTimes:{
      dynamic: 30
    },

    // This tells Turbopack to treat these as native Node.js modules, added from the lucia docs
    // serverComponentsExternalPackages: ['@node-rs/argon2'] 
    //we removed this and added serverExternalPackages outside for argon2 package instead, as per the next.js docs on turbopack, which says serverComponentsExternalPackages is deprecated and to use serverExternalPackages instead
  },
  serverExternalPackages: ['@node-rs/argon2'],

   images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: `${process.env.UPLOADTHING_APP_ID}.ufs.sh`,
        pathname: "/f/*",
      },
    ],
  },

  //in older versions we don't need to make this an async function
  rewrites: async ()=>{
    return [
      {
        source: "/hashtag/:tag",
        destination: "/search?q=%23:tag"
      }
    ]
  }
};

export default nextConfig;
