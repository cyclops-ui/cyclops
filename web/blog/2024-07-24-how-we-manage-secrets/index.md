---
title: How we manage secrets, the Kubernetes way
authors: [jurajk]
---

![how-we-manage-secrets-cover](../../static/img/2024-07-24-how-we-manage-secrets/cover.jpg)

For the past few days, we at Cyclops have been walking between the whiteboard and our laptops, trying to figure out how to design one important part of our project: the authentication of Cyclops to different services. To be more precise, we wanted to allow users to access their private GitHub repos through Cyclops.

Why was this an issue? In the beginning, we were torn between solutions that either **bloated the codebase** by adding a database that Cyclops would not use apart for the authentication or made the **onboarding** **process overly complicated** and scare away potential new users.

After some brainstorming, we found a solution that checked all of our requirements. In this article, I will showcase how Cyclops manages your secrets, the Kubernetes way…

## Why did we need to manage secrets?

A short background about Cyclops so the rest of the article is easier to follow:

Cyclops is a developer-oriented Kubernetes platform. Instead of making your devs learn Helm, Kustomize, or some other Kubernetes configuration manager, Cyclops provides a user interface where they can easily fill in the values to generate needed Kubernetes manifests.

We say it's a platform because you can easily create custom UIs for your Kubernetes workloads (read more about it [here](https://cyclops-ui.com/)). You would store these UIs as templates. You can store templates in several ways, like Helm charts or OCI repositories, but the most popular is probably GitHub repositories.

Cyclops can access templates stored in public repos without issues; provide a `repo + path + version`, and BAM, you got it. **But we wanted to enable Cyclops users to access the templates they stored on their private GitHub repositories** (because you rarely make your infra code public).

We knew we could use GitHub tokens as a form of authentication, but how do we securely handle them?

> ### _By the way…_
>
> _Cyclops is **open-source**, we would greatly appreciate it if you could support us by giving us a star on our [repo](https://github.com/cyclops-ui/cyclops) ⭐ 🙏_

![github-stars](../../static/img/github-stars.gif)

## Kubernetes Secrets

**The first issue** **was** **storing the GitHub access tokens**. Cyclops does not have a database of its own, so implementing one just for storing GitHub tokens seemed like a bad idea. So, we opted to use Kubernetes secrets.

> “_A Secret is an object that contains a small amount of sensitive data, such as a password, **a token**, or a key._“ ~ [Kubernetes docs](https://kubernetes.io/docs/concepts/configuration/secret/)

Kubernetes secrets are a great way of storing sensitive data (like tokens) without exposing it in the pod definition or configuration files, so they seemed like a great fit.

**However, the second issue was how to use these secrets securely.**

## Kubernetes Custom Resources (CRDs)

Let’s quickly discuss custom resource definitions and then we can go on to how we implemented access to private repos.

In Kubernetes, Custom Resource Definitions (CRDs) let you create your own resource types, adding to the default ones Kubernetes provides (pods, deployments, …).

You can define a schema for your custom object with a YAML file and inform Kubernetes. From then on, you can use your custom resource as any other native Kubernetes resource.

_Check out our [previous blog](https://dev.to/cyclops-ui/is-kubernetes-a-database-crds-explained-in-three-minutes-361d), where we explore CRDs and use `kubectl` to gather apples!🍏_

```bash
kubectl get apples

NAME          AGE
green-apple   6s
```

## How we manage secrets, the Kubernetes way

Cyclops has a CRD called `TemplateAuthRule` that allows you to define authorization for specific repositories. The CRD defines which templates you want to authorize and points Cyclops to the authorization data needed for those templates (Kubernetes secrets).

Each time the Cyclops controller fetches a template, it retrieves all `TemplateAuthRules` from the cluster and tries to match the templates repository to any of the `TemplateAuthRules` repositories (in the picture below `spec.repo`). If it does, it will fetch the referenced Kubernetes secrets and apply username and password to authenticate.

![tar_arch.png](../../static/img/templates/private-templates/tar_arch.png)

In the image above, the Cyclops controller fetches all `TemplateAuthRules` and tries to match the template repository to `spec.repo` from a `TemplateAuthRule`. If it matches, it will fetch the username and password from the referenced secret. In this case, both username and password reference the same secret `my-cyclops-secret` (`spec.username.name` and `spec.password.name`).

To fetch the `username` secret value, the Cyclops controller will fetch the referenced secret and use the key provided in `spec.username.key` to get the value from the fetched secret. The same goes for the `password`.

Since `TemplateAuthRules`does not store secrets directly, you can still integrate your cluster with the [External Secret Operator](https://external-secrets.io/) or other secrets management solutions!

> **_Find a more detailed view into `TemplateAuthRules` and a tutorial on how to allow access to your own private repos [here](https://cyclops-ui.com/docs/templates/private_templates) or by using our CLI [here](https://cyclops-ui.com/docs/cyctl/cyctl_create_templateauthrules)_**

## Any questions?

Hope I managed to explain how Cyclops manages your GitHub tokens and maybe even given you an idea of how to manage secrets in your own projects.

If you are interested in being a part of the Cyclops community, to contribute with code, content, or even critique, be sure to join our [Discord community](https://discord.com/invite/8ErnK3qDb3) and leave a star on the [repo](https://github.com/cyclops-ui/cyclops) ⭐ 🙏
