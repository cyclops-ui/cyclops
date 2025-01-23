---
title: "Why we’re betting on Kubernetes (and you should too)"
authors: [jurajk]
---

![Kubernetes casino](../../static/img/2025-01-23-betting-on-k8s/cover.jpg)

To start this off, I want to say that I’m not some *sketchy* betting tips dealer and to be honest, I don’t even watch sports. But I want to share why we’re placing a big bet, a startup-sized bet, on Kubernetes (and we are not the only ones doing it).

And no, it’s not what you think. We’re not just using Kubernetes as part of our tech stack. It’s not that simple. Our entire startup depends on the success of Kubernetes. We are literally all in, and I want to tell you why we feel comfortable with that decision.

I have a couple of important points I want to lay down, and I hope they’ll give you a clear picture of why Kubernetes is not just a safe bet for us but an inevitable one.

## It’s Open-Source

The first thing I need to mention is that **Kubernetes is open-source** and supported by a massive, active community. On GitHub, it boasts over 112K stars.

Being open-source has cultivated a thriving community around it, and I don’t mean that as a buzzword. There’s an incredible amount of content available - blogs, tutorials and videos. While Kubernetes is famously complex, the wealth of resources online makes it far more approachable.

But it doesn’t stop at educational content. Kubernetes’ open-source nature has also enabled an **extensive ecosystem of tools**, integrations, and extensions, from Helm charts to advanced monitoring tools like Prometheus. Tools like these emerged to fill the gaps in Kubernetes, moved it towards widespread adoption, and have become almost a core part of it.

## It’s Battle-Tested

The [first commit](https://github.com/kubernetes/kubernetes/commit/2c4b3a562ce34cddc3f8218a2c4d11c7310e6d56) of Kubernetes was pushed to GitHub on June 6th, 2014, which was more than **ten years ago.**

Since then, it has seen a massive rise in popularity. Not only can you run Kubernetes on your home lab, but every major cloud provider offers a managed version of Kubernetes. Over the years, it has gained the status of “production-ready” and is now the most popular container orchestrator. In 2021, there were **5.6 million developers that use Kubernetes worldwide**; today, that number is undoubtedly even higher.

## It’s the platform for building platforms

> *“Kubernetes is a platform for building platforms. It’s a better place to start; not the endgame.” ~* [*Kelsey Hightower*](https://bsky.app/profile/kelseyhightower.com)

One of the most fascinating aspects of Kubernetes is that it’s not just a tool for managing containers - **it is an extensible API**.

The creators and maintainers of Kubernetes have had great foresight when creating the architecture and design patterns for it. Kubernetes allows you to extend its base functionality with your own custom operators and resources.

### Apples 🍏

Let’s say you want Kubernetes to manage something completely unrelated to containers—like apples. By defining a **Custom Resource Definition (CRD)** for `apples`, you can “teach” Kubernetes to recognize them as a resource type. Kubernetes is now not only a manager for deployments and pods, but for apples, oranges, or whatever else you want. Once that’s done, you can use native Kubernetes commands to interact with your apples:

```bash
kubectl get apples

NAME          AGE
green-apple   6s
```

This silly example shows the power of Kubernetes’ extensibility. By defining `apples` as a custom resource, you make them behave like any native Kubernetes object. This means you can manage them declaratively (e.g., creating or updating their desired state) and enjoy Kubernetes’ core features, like self-healing, scaling, reconciliation loops...

You can imagine that **instead of apples**, you are **interacting with databases or S3 buckets**. Now, suddenly, you can use Kubernetes to provision infrastructure instead of just managing your applications.

This is a very powerful concept.

## So, what are we betting?

At [Cyclops](https://github.com/cyclops-ui/cyclops), we are creating an open-source framework for building developer platforms on Kubernetes.

We believe that **Kubernetes is not just a trend - it’s the future of building cloud-based services.** As the ecosystem matures, Kubernetes is quickly becoming the standard for managing and orchestrating workloads in the cloud.

We’re betting on **Kubernetes becoming the foundation for developer platforms.** More and more companies are interested in building custom developer platforms that empower their teams. These platforms streamline workflows, simplify the development process, and provide tailored tools for their unique needs (learn more about [platform engineering](https://cyclops-ui.com/blog/2024/10/17/platform-engineering)).

**We are betting on companies building developer platforms on top of Kubernetes, and we want to help them on this journey.**

***By the way…***

*We're developing Cyclops as an open-source project. If you're keen to give it a try, here's a quick start guide available on our [repository](*https://github.com/cyclops-ui/cyclops*). If you like what you see, consider showing your support by giving us a star ⭐*

> ⭐ [***Star Cyclops on GitHub***](https://github.com/cyclops-ui/cyclops) ⭐
