---
title: "Cyclops Launch Week #1"
authors: [jurajk]
---

![launch-week-teaser](../../static/img/2024-11-22-launch-week-1/launch-week-3.png)

**Cyclops is having its very first launch week, starting on November 25th!**

For an entire week, we will be unveiling a feature a day - that's **five features** in total!

We don't want to spoil the surprise just yet, but if you're as **impatient** as we are, we invite you to join our **Discord session** that is happening on **Monday, November 25th, at 6 pm CET**! We will preview all of the features we plan to reveal throughout the week and host an Ask-Me-Anything session afterward.

To reserve your spot, visit the [event in our Discord](https://discord.gg/MvecUE9y?event=1308173306821742612) server and mark yourself as interested.

![discord-event](../../static/img/2024-11-22-launch-week-1/discord-event.png)

Come back here each day to see what we launch, or follow us on **[X](https://x.com/CyclopsUI) and [LinkedIn](https://www.linkedin.com/company/96014689/)** to keep up to date and follow the hashtag **#cyclopslaunchweek**

## #1 Helm Releases ⚡

With the release of this feature, **Cyclops will pick up on any installed Helm releases in your cluster** and showcase them in our **new tab - Helm Releases.**

Besides reviewing all of your installed Helm releases in a cluster, through this tab you can inspect them as well. You can **view all the resources** your Helm release is made up of, **edit the releases** through the UI, and **delete** them.

![helm-releases](../../static/img/2024-11-22-launch-week-1/1-helm-releases.png)

Although Cyclops Modules are a more powerful way of managing your applications in the cluster, the Helm releases manager offers a good starting point since it does not require you to change your current CI/CD pipelines or workflows. We also found them great for environments with short lifecycles - such as testing or staging clusters!

## #2 GitOps 🦑

We know this was a highly requested feature, and we are happy to announce that **Cyclops now supports a GitOps workflow!**

All applications within Cyclops are defined as **CRs** called **Modules**. Each time a Module is created, the **Cyclops controller** picks it up, creates other Kubernetes resources from it, and applies them to the cluster. Since Modules are CRDs, you can define them via the YAML manifest. Those manifests allow you to define everything you need for your application in a single place.

Since a **Module can be defined through a manifest**, it can be **stored on a** **git repo** and included in your **GitOps workflow**!

Through the Module manifest, you can also define which values you want to make editable through Cyclops and which values should be handled only with GitOps. For example, the image version should only be handled with GitOps, but you want to enable developers to scale the number of replicas through Cyclops.

**We created a guide** you can follow to get started, check it out [here](https://github.com/cyclops-ui/gitops-starter)!

## #3 Namespace Scoped Cyclops 🔬

We know this was a thorn in your side, but from now on, you can restrict Cyclops to a **single namespace** to **limit the permissions** needed for your Cyclops installation! 

Firstly, we introduced **three** **new environment** variables `WATCH_NAMESPACE`, `MODULE_TARGET_NAMESPACE` and `WATCH_NAMESPACE_HELM`, which will help you configure your Cyclops instance to act only in specific namespaces.

```yaml
...
- name: cyclops-ctrl
  image: cyclopsui/cyclops-ctrl:v0.15.2
  ports:
    - containerPort: 8080
  env:
    - name: PORT
      value: "8080"
    - name: WATCH_NAMESPACE
      value: "my-namespace"
    - name: MODULE_TARGET_NAMESPACE
      value: "my-namespace"
    - name: WATCH_NAMESPACE_HELM
      value: "my-namespace"
...
```

Secondly, we created a Helm chart that utilizes these env variables to create **Roles** and **RoleBindings** **for Cyclops** to be scoped to a single namespace of your choosing. And, of course, we made a guide on how to use these env variables and how to easily get set up - check it out [here](https://cyclops-ui.com/docs/installation/namespace-scope)!

_**To be continued ...**_
