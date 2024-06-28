<p align="center" width="100%">
<img width="75%" src="./web/static/img/cyclops-simplistic.png">
<p/>
<h1></h1>
<p align="center">Customizable UI for Kubernetes Workloads 👁️</p>

<div align="center">
    <a style="width: 100%" href="https://landscape.cncf.io/?item=app-definition-and-development--application-definition-image-build--cyclops">
        <img height="20" src="https://img.shields.io/badge/CNCF%20Landscape-5699C6?color=5699C6">
    </a>
    <a style="width: 100%" href="https://hub.docker.com/repository/docker/cyclopsui/cyclops-ui/general">
        <img height="20" src="https://img.shields.io/docker/pulls/cyclopsui/cyclops-ui?logo=docker&color=%230db7ed">
    </a>
    <a style="width: 100%" href="https://goreportcard.com/report/github.com/cyclops-ui/cyclops/cyclops-ctrl">
        <img height="20" src="https://goreportcard.com/badge/github.com/cyclops-ui/cyclops/cyclops-ctrl?labelColor=white">
    </a>
</div>

![which-would-you-prefer.png](web%2Fstatic%2Fimg%2Fwhich-would-you-prefer.png)

Welcome to Cyclops, a powerful user interface for managing and interacting with Kubernetes clusters. Cyclops is designed
to simplify the management of containerized applications on Kubernetes, providing an intuitive and user-friendly
experience for developers, system administrators, and DevOps professionals. Divide the responsibility between your
infrastructure and your developer teams so everyone can play to their strengths. Automate your processes and shrink
the window for deployment mistakes. [Find out more!](https://cyclops-ui.com)

![Module Overview](./web/static/img/readme-demo.png)

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
kubectl apply -f https://raw.githubusercontent.com/cyclops-ui/cyclops/v0.7.1/install/cyclops-install.yaml && kubectl apply -f https://raw.githubusercontent.com/cyclops-ui/cyclops/v0.7.1/install/demo-templates.yaml
```

It will create a new namespace called `cyclops` and deploy everything you need for your Cyclops instance to run.

Now all that is left is to expose Cyclops server outside the cluster:

```bash
kubectl port-forward svc/cyclops-ui 3000:3000 -n cyclops
```

You can now access Cyclops in your browser on [http://localhost:3000](http://localhost:3000).

## :floppy_disk: Templates

Every Cyclops instance comes with a couple of predefined templates, feel free to use and abuse them!

Helm charts used for these templates can be found [here](https://github.com/cyclops-ui/templates). You can use this repo as a guide if you want to create your own templates. More information on creating your own can be found on our [web](https://cyclops-ui.com/docs/templates/).

## :chart_with_upwards_trend: Future work

- RBAC
- support for accessing charts stored on private GitHub repositories
- Git as manifest destination
- Customizable Module details page

Feel free to suggest features you would like to see!
