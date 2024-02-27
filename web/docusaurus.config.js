// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Cyclops",
  tagline: "Dev friendly Kubernetes",
  favicon: "img/logo.png",

  // Set the production url of your site here
  url: "https://cyclops-ui.github.io",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "cyclops-ui", // Usually your GitHub org/user name.
  projectName: "cyclops-ui.github.io", // Usually your repo name.

  onBrokenLinks: "ignore",
  onBrokenMarkdownLinks: "warn",

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "@docusaurus/preset-classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
        },
        gtag: {
          trackingID: "G-MNT2DFSGCM",
          anonymizeIP: true,
        },
        blog: {
          showReadingTime: true,
          blogSidebarCount: "ALL",
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: "img/which-would-you-prefer.png",
      announcementBar: {
        backgroundColor: "#68b6ac",
        textColor: "#ffffff",
        isCloseable: false,

        content:
          '<b>🔔 We are launching our first release on <a href="https://www.producthunt.com/products/cyclops">Product Hunt</a> - show us your support 🔔</b>',
      },
      navbar: {
        title: "Cyclops",
        logo: {
          alt: "Cyclops logo",
          src: "img/logo.png",
        },
        items: [
          {
            type: "docSidebar",
            sidebarId: "tutorialSidebar",
            position: "left",
            label: "Docs",
          },
          { to: "blog", label: "Blog", position: "left" },
          {
            href: "https://www.linkedin.com/company/cyclops-ui",
            position: "right",
            className: "header-linkedin-link",
          },
          {
            href: "https://github.com/cyclops-ui/cyclops",
            position: "right",
            className: "header-github-link",
          },
          {
            href: "https://discord.com/invite/8ErnK3qDb3",
            className: "header-discord-link",
            position: "right",
          },
        ],
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "Docs",
            items: [
              {
                label: "About",
                to: "/docs/about",
              },
              {
                label: "Installation",
                to: "/docs/installation/prerequisites",
              },
            ],
          },
          {
            title: "Community",
            items: [
              {
                label: "Discord",
                href: "https://discord.com/invite/8ErnK3qDb3",
              },
              {
                label: "DEV Community",
                href: "https://dev.to/cyclops-ui",
              },
              {
                label: "Product Hunt",
                href: "https://www.producthunt.com/products/cyclops",
              },
            ],
          },
          {
            title: "More",
            items: [
              {
                label: "GitHub",
                href: "https://github.com/cyclops-ui/cyclops",
              },
              {
                label: "Schedule a demo",
                href: "https://docs.google.com/forms/d/e/1FAIpQLSfm9sSsmqJYsofteSrGigWMW9eOgSjoinHwjsvtjX6wOcAv9w/viewform",
              },
              {
                label: "Leave your feedback",
                href: "https://forms.gle/jrwcBHRtpwmK91v47",
              },
            ],
          },
          {
            title: "Contact",
            items: [
              {
                label: "LinkedIn",
                href: "https://www.linkedin.com/company/cyclops-ui/",
              },
              {
                html: "info@cyclops-ui.com",
              },
            ],
          },
        ],
      },
      colorMode: {
        defaultMode: "light",
        disableSwitch: true,
      },
    }),
};

module.exports = config;
