[![CNCF Badge](https://img.shields.io/badge/CNCF%20Landscape-5699C6?style=flat-square&color=5699C6)](https://landscape.cncf.io/?item=app-definition-and-development--application-definition-image-build--cyclops)
[![Docker Pulls](https://img.shields.io/docker/pulls/cyclopsui/cyclops-ui?style=flat-square&logo=docker&color=%230db7ed)](https://hub.docker.com/repository/docker/cyclopsui/cyclops-ui/general)
[![Go Report Card](https://goreportcard.com/badge/github.com/cyclops-ui/cyclops/cyclops-ctrl?style=flat-square)](https://goreportcard.com/report/github.com/cyclops-ui/cyclops/cyclops-ctrl)
[![GitHub Actions CI](https://img.shields.io/github/actions/workflow/status/cyclops-ui/cyclops/ci.yml?style=flat-square&logo=github&logoColor=white&label=cyclops%20build)](https://github.com/cyclops-ui/cyclops/actions/workflows/ci.yml)
[![GitHub Actions web](https://img.shields.io/github/actions/workflow/status/cyclops-ui/cyclops/web.yaml?style=flat-square&logo=github&logoColor=white&label=GitHub%20pages%20build)](https://github.com/cyclops-ui/cyclops/actions/workflows/web.yaml)
[![GitHub License](https://img.shields.io/github/license/cyclops-ui/cyclops?style=flat-square&link=https%3A%2F%2Fgithub.com%2Fcyclops-ui%2Fcyclops%2Fblob%2Fmain%2FLICENSE)](https://github.com/cyclops-ui/cyclops/blob/main/LICENSE)
[![Discord](https://img.shields.io/discord/1103010228884209824?style=flat-square&logo=Discord&logoColor=white&label=Discord&color=%237289da)](https://discord.com/invite/8ErnK3qDb3)

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

# 🌌 **Cyclops: Your Adventure into Developer-Friendly Kubernetes**  

---

### **The Call to Adventure – What is Cyclops?**  

In the bustling world of modern software, Kubernetes towers like a maze. Developers brave the wilds of **YAML** and **complex deployments** while product managers and QAs watch from the sidelines, unable to contribute meaningfully. Many have tried to conquer this beast—hours spent configuring manifests, sleepless nights debugging deployments. But no more!

Enter **Cyclops**, the one-eyed guide, **an open-source dev tool** designed to **simplify Kubernetes**. Cyclops extends its hand to developers, offering an intuitive **UI** that removes the need for tedious YAML configurations. The once-complex journey of **configuring, validating, and deploying** applications is now reduced to **a few clicks**.  

With **Cyclops's template system**, even the most intimidating Kubernetes setup becomes manageable. Templates, like magical artifacts, can be **customized** to fit any need, unlocking faster and easier deployments. **Cyclops** ensures everyone—DevOps, product managers, developers—can take part in the adventure.

---

### **Behind the Scenes – How Does Cyclops Work?**  

**Cyclops isn't just a UI—it's a bridge between complex infrastructure and seamless collaboration.**  
Picture a world where your QA team and product managers create deployments without writing code. That’s the magic of Cyclops.  

For **DevOps wizards**, Cyclops serves as a mighty tool to build custom interfaces.  
For **developers and non-technical adventurers**, Cyclops provides predefined templates to get started without a hitch.

And here’s the twist—Cyclops doesn’t reinvent the wheel. **It uses Helm charts** behind the scenes, allowing you to integrate any of your existing Helm charts.  
Feel the need to explore? Use any **public Helm chart** with Cyclops and create UIs that will **simplify** even the most challenging deployments.

**Worried about not having a DevOps team?** Cyclops has your back with ready-to-use templates! **Deploy with ease** and focus on building your dream applications, without worrying about the minutiae of Kubernetes.

---

### **The Ritual – Installing Cyclops**  

No adventure is complete without setting up the right tools. Here’s how to summon **Cyclops** into your Kubernetes cluster:  

#### **Option 1: Install with Kubectl**  
```bash
kubectl apply -f https://raw.githubusercontent.com/cyclops-ui/cyclops/v0.14.1/install/cyclops-install.yaml && \
kubectl apply -f https://raw.githubusercontent.com/cyclops-ui/cyclops/v0.14.1/install/demo-templates.yaml
```

This command creates the **Cyclops namespace** and deploys everything you need to begin your journey.

Now, all that’s left is to expose the **Cyclops server**:  
```bash
kubectl port-forward svc/cyclops-ui 3000:3000 -n cyclops
```
Adventure begins at: **[http://localhost:3000](http://localhost:3000)**  

---

#### **The Power of the CLI – Installing `cyctl`**  
For heroes who enjoy the command line, **`cyctl`** is your companion!  

```bash
brew install cyctl
```

With **`cyctl`**, you can:  
- Explore modules and templates with ease.  
- Automate deployments using **GitHub Actions**.  
- Integrate **seamless workflows** into your development process.

Publish your templates on **GitHub** and watch them connect automatically to Cyclops with **GitHub Actions**—giving developers **instant access** to the latest updates.

---

### **The Treasures of Cyclops – Templates**  

Every Cyclops instance is like a treasure trove of **predefined templates**. These templates reduce complex deployments into **simple, repeatable steps**.  

Want to explore these treasures?  
- Check out the Helm chart templates [here](https://github.com/cyclops-ui/templates).  
- Use the templates as guides to **create your own artifacts**.  
- Customize them to fit your needs, and **unleash the full power** of Cyclops.

---

### **The Fellowship – Contributing to Cyclops**  

Cyclops thrives on a **strong community of adventurers**. Join us on this journey and help shape the future of Kubernetes management. Here are ways to contribute:  

- **Code Contributions**: Submit your Pull Requests on [GitHub](https://github.com/cyclops-ui/cyclops).  
- **Feedback**: Help us improve by sharing your experience and suggestions.  
- **Templates**: Add to the ever-growing library of Helm templates.  
- **Support**: Give us a ⭐ on GitHub and inspire others to join the fellowship!

<p align="center">
    <a href="https://github.com/cyclops-ui/cyclops/graphs/contributors">
        <img src="https://contrib.rocks/image?repo=cyclops-ui/cyclops&columns=10" />
    </a>
</p>

---

### **The Road Ahead – Cyclops's Roadmap**  

The adventure is far from over—**new features** and exciting enhancements lie ahead! Here’s what’s coming soon:

- ✅ **Private Repository Support** – Access templates from private GitHub repositories.  
- 🔒 **Authentication & Secure Login** – Safeguard your deployment environments.  
- 🛠️ **Role-Based Access Control (RBAC)** – Control what your developers can access.  
- 🔄 **GitOps Tool Integration** – Align with GitOps workflows seamlessly.  
- 📦 **Kustomize Support** – Go beyond Helm with more configuration options.  
- 💻 **Windows Support for `cyctl`** – Install via **Chocolatey** and join from any platform.  
- 🎨 **Custom Module Views** – Build detailed resource views to suit your needs.

---

### **The Community – Join the Adventure**  

Every great story is shared with companions. Join the **Cyclops community** today:

- **[Webpage](https://cyclops-ui.com)**  
- **[Discord](https://discord.com/invite/8ErnK3qDb3)**  
- **[X (formerly Twitter)](https://x.com/CyclopsUI)**  
- **[LinkedIn](https://www.linkedin.com/company/cyclops-ui)**  

Together, we can **explore new frontiers**, build extraordinary things, and inspire others to **embrace Kubernetes**—without fear, frustration, or fatigue.

---

### **Epilogue: Your Journey Begins Now**  

With Cyclops, your Kubernetes adventure becomes a story worth telling. **No more complex YAML**, no more wasted hours—just simple, powerful tools that help you **focus on what matters most**: building amazing applications.  

Start your adventure today. Unlock the full potential of Kubernetes with **Cyclops by your side**.

---

**Cyclops: Kubernetes. Simplified. Amplified.**

- ~~**Support for private GitHub repos** -> access templates saved on your private repositories~~ ✅
- **Authentification** -> secure login
- **Role-based access control** -> limit the resources your devs have access to
- **GitOps** -> integrate with GitOps tools
- **Support for Kustomize** -> currently, only Helm is supported for creating templates
- **`cyctl` for Windows** -> Chocolatey
- **Customizable Module details page** -> create custom views of resources that your module uses
