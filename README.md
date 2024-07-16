[![CNCF Badge](https://img.shields.io/badge/CNCF%20Landscape-5699C6?style=flat-square&color=5699C6)](https://landscape.cncf.io/?item=app-definition-and-development--application-definition-image-build--cyclops)
[![Docker Pulls](https://img.shields.io/docker/pulls/cyclopsui/cyclops-ui?style=flat-square&logo=docker&color=%230db7ed)](https://hub.docker.com/repository/docker/cyclopsui/cyclops-ui/general)
[![Go Report Card](https://goreportcard.com/badge/github.com/cyclops-ui/cyclops/cyclops-ctrl?style=flat-square)](https://goreportcard.com/report/github.com/cyclops-ui/cyclops/cyclops-ctrl)
[![GitHub Actions CI](https://img.shields.io/github/actions/workflow/status/cyclops-ui/cyclops/ci.yml?style=flat-square&logo=github&logoColor=white&label=cyclops%20build)](https://github.com/cyclops-ui/cyclops/actions/workflows/ci.yml)
[![GitHub Actions web](https://img.shields.io/github/actions/workflow/status/cyclops-ui/cyclops/web.yaml?style=flat-square&logo=github&logoColor=white&label=GitHub%20pages%20build)](https://github.com/cyclops-ui/cyclops/actions/workflows/web.yaml)
[![GitHub License](https://img.shields.io/github/license/cyclops-ui/cyclops?style=flat-square&link=https%3A%2F%2Fgithub.com%2Fcyclops-ui%2Fcyclops%2Fblob%2Fmain%2FLICENSE)](https://github.com/cyclops-ui/cyclops/blob/main/LICENSE)

<p align="center">
    <a href="https://www.producthunt.com/products/cyclops?utm_source=badge-follow&utm_medium=badge&utm_souce=badge-cyclops" target="_blank">
        <img src="https://api.producthunt.com/widgets/embed-image/v1/follow.svg?product_id=566069&theme=light" alt="Cyclops - Developer&#0032;Friendly&#0032;Kubernetes | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" />
    </a>
</p>

<hr>

<p align="center" width="100%">
    <img width="75%" src="./web/static/img/cyclops-simplistic.png">
<p/>
<h3 align="center">Developer Friendly Kubernetes</h3>
<p align="center">
    <a href="https://cyclops-ui.com">Webpage</a>
    -
    <a href="https://discord.com/invite/8ErnK3qDb3">Discord</a>
    -
    <a href="https://x.com/CyclopsUI">X</a>
    -
    <a href="https://www.linkedin.com/company/cyclops-ui">LinkedIn</a>
</p>

## 🟠 What is Cyclops?

Cyclops is an open-source dev tool that simplifies Kubernetes with an easy-to-use UI, making it less daunting and easy to use. Instead of creating and configuring your Kubernetes manifests with YAML, use Cyclops to quickly and easily configure and deploy your applications - validations included!

The UI that Cyclops provides is highly customizable when it comes to defining your configurations through its templates feature. It also comes with a couple of predefined templates to get you started on your journey. Thanks to our templates, Cyclops turns hours and days of configuring applications into a few clicks.

<img align="center" src="https://github.com/user-attachments/assets/4c1e3fff-7106-4afb-9c29-e0aef7d7dd86"/>

## 💡 How it works?

Cyclops is a platform that allows DevOps teams to quickly and without coding create custom UIs (called templates) for developers, QA teams, product managers, and other team members who do not necessarily have experience working with Kubernetes.

**But don’t worry! If you do not have a DevOps team with you, Cyclops comes with a bunch of predefined templates to get you started!**

Under the hood, Cyclops uses Helm charts to create your desired UIs. This means you can try Cyclops with any of your existing Helm charts or any public Helm charts you can find! (Just make sure they have a `values.schema.json` file).

Read more about it [here](#-templates)

## ⚙️ Install

> _⚠️ Before installing Cyclops, make sure you have all the [prerequisites](https://cyclops-ui.com/docs/installation/prerequisites) ⚠️_

Cyclops can either be installed manually by applying the latest manifest or with the [Glasskube Kubernetes Package Manager](https://github.com/glasskube/glasskube/).

To install Cyclops using `kubectl` into your cluster, run commands below:

```bash
kubectl apply -f https://raw.githubusercontent.com/cyclops-ui/cyclops/v0.8.2/install/cyclops-install.yaml && kubectl apply -f https://raw.githubusercontent.com/cyclops-ui/cyclops/v0.8.2/install/demo-templates.yaml
```

It will create a new namespace called `cyclops` and deploy everything you need for your Cyclops instance to run.

Now all that is left is to expose Cyclops server outside the cluster:

```bash
kubectl port-forward svc/cyclops-ui 3000:3000 -n cyclops
```

You can now access Cyclops in your browser on [http://localhost:3000](http://localhost:3000).

## 💾 Templates

Every Cyclops instance comes with a couple of predefined templates. Feel free to use and abuse them!

Helm charts used for these templates can be found [here](https://github.com/cyclops-ui/templates). You can use this repo as a guide if you want to create your own templates. More information on creating your own can be found on our [web](https://cyclops-ui.com/docs/templates/).

## 🚧 `cyctl`

The Cyclops command line interface! You can install it with [Homebrew](https://formulae.brew.sh/formula/cyctl#default):

```bash
brew install cyctl
```

**What are you able to do with `cyctl`?**

Besides the basic commands like getting all modules or templates, you can integrate it with GitHub actions to automate some of the Cyclops processes.

For example, once you create a template and publish it on GitHub, GitHub actions could automatically connect the template to your Cyclops instance using our CLI. This would **allow your developers instant access to each new template or even any update the template receives**.

## 💪 Contributing

Cyclops is **open-source** and open to external contributors. There are plenty of ways you can contribute to the Cyclpos project - with code, feedback, content and GitHub stars ⭐

Start your contributing journey at our [CONTRIBUTING.md](./CONTRIBUTING.md) file and join our wall of fame 👐

<a align="center" width="705" href="https://github.com/cyclops-ui/cyclops/graphs/contributors">
<img src="https://contrib.rocks/image?repo=cyclops-ui/cyclops" />
</a>

## 🧭 Roadmap

> _⚠️ This is not set in stone and may change in the future ⚠️_

- ~~**Support for private GitHub repos** -> access templates saved on your private repositories~~ ✅
- **Authentification** -> secure login
- **Role-based access control** -> limit the resources your devs have access to
- **GitOps** -> integrate with GitOps tools
- **Support for Kustomize** -> currently, only Helm is supported for creating tsemplates
- **`cyctl` for Windows** -> Chocolatey
- **Customizable Module details page** -> create custom views of resources that your module uses
