module.exports = {
    presets: [
        [
            require.resolve('@docusaurus/core/lib/babel/preset'),
            {
                gtag: {
                    trackingID: 'G-MNT2DFSGCM',
                    anonymizeIP: true,
                },
            },
        ],
    ],
};
