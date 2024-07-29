// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

import { Button } from "antd";

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
      image: "img/cyclops-social-card.png",
      navbar: {
        style: "dark",
        logo: {
          alt: "Cyclops logo",
          src: "img/cyclops-simplistic.png",
        },
        items: [
          {
            type: "docSidebar",
            sidebarId: "tutorialSidebar",
            position: "left",
            label: "Docs",
          },
          {
            to: "pricing",
            label: "Pricing",
            position: "left",
          },
          { to: "blog", label: "Blog", position: "left" },
          {
            type: "html",
            position: "right",
            value:
              '<a href="/docs/installation/install/manifest" style="background-color: #FF8803; color: #FFF; height: 30px; width: 150px; text-decoration: none; display: inline-flex; align-items: center; border-radius: 30px 30px 30px 30px"' +
              "onmouseover=\"this.style.backgroundColor='#FFA229';\"" +
              "onmouseout=\"this.style.backgroundColor='#FF8803';\">" +
              '<h3 style="margin: 0px auto;">' +
              "Get started" +
              "</h3>" +
              "</a>",
          },
          {
            href: "https://github.com/cyclops-ui/cyclops",
            position: "right",
            className: "header-github-link",
          },
          {
            href: "https://www.linkedin.com/company/cyclops-ui",
            position: "right",
            className: "header-linkedin-link",
          },
          {
            href: "https://x.com/CyclopsUI",
            position: "right",
            className: "header-x-link",
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
            items: [
              {
                html: `
                <a href="https://landscape.cncf.io/">
                  <img src="/img/cncf-white.png"/>
                </a>
              `,
              },
              {
                html: `
                <div style="padding-top: 20px">
                  <a href="https://nuqleus.io/">
                    <img src="/img/nuqleus_landscape.png"/>
                  </a>
                </div>
              `,
              },
              {
                html: `
                <div style="width: 100%; padding-top: 10px">
                  <a href="https://filrougecapital.com/">
                    <img style="width: 50%" src="/img/frc-white.png"/>
                  </a>
                  <a href="https://www.zicer.hr/?lang=en">
                    <img style="width: 45%; right: 0; position: relative" src="/img/zicer.png"/>
                  </a>
                </div>
              `,
              },
              {
                html: `
                <a>
                  <img style="width: 100%; padding-top: 20px" src="/img/esif.png"/>
                </a>
              `,
              },
            ],
          },
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
                html: `
                    <div>
                        <link href="https://assets.calendly.com/assets/external/widget.css" rel="stylesheet">
                            <a style="color: #FFF" href="" onclick="Calendly.initPopupWidget({url: 'https://calendly.com/cyclops-ui/cyclops'});return false;">Schedule a demo</a>
                        </link>
                    </div>
                `,
              },
              {
                label: "GitHub",
                href: "https://github.com/cyclops-ui/cyclops",
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
                label: "X",
                href: "https://x.com/CyclopsUI",
              },
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
        copyright: `Copyright © ${new Date().getFullYear()} Cyclops UI`,
      },
      colorMode: {
        defaultMode: "light",
        disableSwitch: true,
      },
    }),
};

module.exports = config;
