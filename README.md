<p align="center" width="100%">
<img width="40%" src="https://github.com/cyclops-ui/cyclops/assets/72022639/53009fdd-ff0a-45c8-a04e-cda495e8b34e">
<p/>
<h1 align="center">Cyclops</h1>
<p align="center">customizable UI for Kubernetes workloads 👁️</p>

<div align="center">
    <a href="https://github.com/cyclops-ui/cyclops/blob/main/LICENSE"><img height="20" src="https://img.shields.io/github/license/cyclops-ui/cyclops"></a>
    <a href="https://github.com/cyclops-ui/cyclops/actions/workflows/web.yaml"><img height="20" src="https://github.com/cyclops-ui/cyclops/actions/workflows/web.yaml/badge.svg"></a>
    <a href="https://github.com/cyclops-ui/cyclops/actions/workflows/ci.yml"><img height="20" src="https://github.com/cyclops-ui/cyclops/actions/workflows/ci.yml/badge.svg"></a>
</div>

![which-would-you-prefer.png](web%2Fstatic%2Fimg%2Fwhich-would-you-prefer.png)

Welcome to Cyclops, a powerful user interface for managing and interacting with Kubernetes clusters. Cyclops is designed
to simplify the management of containerized applications on Kubernetes, providing an intuitive and user-friendly
experience for developers, system administrators, and DevOps professionals. Divide the responsibility between your
infrastructure and your developer teams so everyone can play to their strengths. Automate your processes and shrink
the window for deployment mistakes. [Find out more!](https://cyclops-ui.com)

![Screenshot 2022-04-06 at 20 26 17](https://user-images.githubusercontent.com/72022639/162033638-845b5f2c-f1df-4e17-b2fc-ba4ab318f887.png)

Find out how to [install](https://cyclops-ui.com/docs/installation/prerequisites) it to your cluster on our landing page
and give it a go! (~10 minute tutorial)

[//]: # "## :star2: Supporters"
[//]: # "<p>"
[//]: # '    <a href="https://github.com/cyclops-ui/cyclops/stargazers">'
[//]: # '        <img width="100%" src="https://reporoster.com/stars/cyclops-ui/cyclops" alt="Stargazers repo roster for @cyclops-ui/cyclops">'
[//]: # "    </a>"
[//]: # "</p>"
[//]: # "[![Forkers repo roster for @cyclops-ui/cyclops](https://reporoster.com/forks/cyclops-ui/cyclops)]"

## :gear: Install

⚠️ Before installing Cyclops, make sure you have all the [prerequisites](https://cyclops-ui.com/docs/installation/prerequisites) ⚠️

Cyclops can either be installed manually by applying the latest manifest or with the [Glasskube Kubernetes Package Manager](https://github.com/glasskube/glasskube/).  

To install Cyclops using `kubectl` into your cluster, run commands below:

```bash
kubectl apply -f https://raw.githubusercontent.com/cyclops-ui/cyclops/v0.0.1-alpha.14/install/cyclops-install.yaml
```

It will create a new namespace called `cyclops` and deploy everything you need for your Cyclops instance to run.

Now all that is left is to expose Cyclops server outside the cluster:

```bash
kubectl port-forward svc/cyclops-ui 3000:3000 -n cyclops
```

You can now access Cyclops in your browser on [http://localhost:3000](http://localhost:3000).

## :chart_with_upwards_trend: Future work

- RBAC
- Cluster nodes overview
- Git as manifest destination
- Customizable Module details page

Feel free to suggest features you would like to see!
