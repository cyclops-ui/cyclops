# Cyclops

<p align="center" width="100%">
<img width="25%" alt="Screenshot 2022-04-03 at 21 48 18" src="https://user-images.githubusercontent.com/72022639/162230553-e669e572-1346-4289-814b-bd23d5b2d100.png">
<p/>

Developer friendly Kubernetes

<a href="https://github.com/cyclops-ui/cyclops/blob/main/LICENSE"><img height="20" src="https://img.shields.io/github/license/cyclops-ui/cyclops"></a>
<a href="https://github.com/cyclops-ui/cyclops/actions/workflows/web.yaml"><img height="20" src="https://github.com/cyclops-ui/cyclops/actions/workflows/web.yaml/badge.svg"></a>

[//]: # (<a href="https://github.com/cyclops-ui/cyclops/actions/workflows/ctrl-ci.yml"><img height="20" src="https://github.com/cyclops-ui/cyclops/actions/workflows/ctrl-ci.yml/badge.svg"></a>)
[//]: # (<a href="https://github.com/cyclops-ui/cyclops/actions/workflows/ui-ci.yml"><img height="20" src="https://github.com/cyclops-ui/cyclops/actions/workflows/ui-ci.yml/badge.svg"></a>)

![which-would-you-prefer.png](web%2Fstatic%2Fimg%2Fwhich-would-you-prefer.png)

Welcome to Cyclops, a powerful user interface for managing and interacting with Kubernetes clusters. Cyclops is designed
to simplify the management of containerized applications on Kubernetes, providing an intuitive and user-friendly
experience for developers, system administrators, and DevOps professionals. Divide the responsibility between your
infrastructure and your developer teams so everyone can play to their strengths. Automate your processes and shrink
the window for deployment mistakes. [Find out more!](https://cyclops-ui.com)

![Screenshot 2022-04-06 at 20 26 17](https://user-images.githubusercontent.com/72022639/162033638-845b5f2c-f1df-4e17-b2fc-ba4ab318f887.png)

Find out how to [install](https://cyclops-ui.com/docs/installation/prerequisites) it to your cluster on our landing page
and give it a go! (~10 minute tutorial)

# Install

⚠️ Before installing Cyclops, make sure you have all the [prerequisites](./prerequisites) ⚠️

To install Cyclops in your cluster, run commands below:

```bash
kubectl apply -f https://raw.githubusercontent.com/cyclops-ui/cyclops/v0.0.1-alpha.3/install/cyclops-install.yaml
```

It will create a new namespace called `cyclops` and deploy everything you need for your Cyclops instance to run.

Now all that is left is to expose Cyclops server outside the cluster. You will still need to expose both backend and
frontend with the commands below. Expose frontend through:

```bash
kubectl port-forward svc/cyclops-ui 3000:3000 -n cyclops
```

and backend through:

```bash
kubectl port-forward svc/cyclops-ctrl 8080:8080 -n cyclops
```

You can now access Cyclops in your browser on [http://localhost:3000](http://localhost:3000).

# Future work

* Better error handling
* Make Cyclops work with all resources (initial version supporting only Deployments and Services)
* Fetch templates by git revisions
* Cyclops Module status calculation
* Create more different templates that can be imported from git
* Support nested fields in the template
* Customizable details page

Feel free to suggest features you would like to see!
