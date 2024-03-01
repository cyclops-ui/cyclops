# New Module

Now that you have your Cyclops instance deployed locally, you can try to deploy an application into the cluster through
Cyclops

## Add a new module

When you start up Cyclops, the first screen that will be shown to you is the _Modules_ screen. This screen should be
empty at the moment. What we want to do next is click on the _Add module_ button in the top right corner.

## Define your module

Now, we want to define our new module. Under the _Module template_, we want to put the URL that leads to a GitHub
repository where we saved our configuration files. For the sake of this tutorial, we will be using our own
[template](https://github.com/cyclops-ui/templates), which holds a configuration template we made for testing purposes.
Feel free to use our template repository! We will be using the _demo_ template from the repository. Also, for any
template, you can specify the version, which is the third field. If you are referencing a template stored in git, you can
specify a version as a branch name, tag, or commit hash. If you don't specify anything, it will default to the latest
commit on the default branch.

![Successfully loaded template](../../../static/img/demo/template_load_success.png?raw=true "Successfully loaded template")

Now all that's left to do is fill the form with values!
Here is an example of values you could use:

```yaml
Module name: demo
name: demo-1
replicas: 3
image: nginx
version: 1.14.2
service: true
```

Now click save and you should see your new module listed on the main page!

![Listed Module](../../../static/img/demo/module_listed.png?raw=true "Listed Module")

## Try it out

Once you have deployed your application, you can check its resources and information on the Module details page. If you
have tried out Cyclops with the suggested template and values, you can open your application by exposing it to the
outside world and visiting it.  
You can expose it with the following command

```bash
kubectl port-forward svc/demo-1 8888:80
```

If this step was successful, you could try visiting [http://localhost:8888](http://localhost:8888), and you should see the Nginx hello message.

![Welcome to Nginx](../../../static/img/demo/nginx_hello.png?raw=true "Listed Module")

Of course, this is just a simple example, but using Cyclops and a predefined template, you could deploy and expose your
application in a few clicks without having to get into the details of Kubernetes figuring out how to deploy your
application.

## Potential problems

### Error loading template

This usually means that you didn't input the right `url + path + version`. When loading the template to Cyclops, you
need to copy the URL from the GitHub repository that leads to the template. The URL must lead towards a directory that
holds a `template` folder.

In our example we filled the form with the values bellow:

```yaml
repository: https://github.com/cyclops-ui/templates
path: demo
version: main
```

### Naming

If Cyclops seemingly freezes when trying to save the module, it probably means you didn't follow [the Kubernetes naming
convention](https://kubernetes.io/docs/concepts/overview/working-with-objects/names/).

1. [x] contain no more than 63 characters
2. [x] contain only **lowercase** alphanumeric characters, '-' or '. '
3. [x] start with an alphanumeric character
4. [x] end with an alphanumeric character
