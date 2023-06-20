# New Module
Now that you have your Cyclops instance deployed locally, you can try to deploy an application into the cluster through
Cyclops

## Add a new module
When you start up Cyclops, the first screen that will be shown to you is the _Modules_ screen. This screen should be
empty at the moment. What we want to do next is click on the _Add module_ button in the top right corner.

## Define your module
Now we want to define our new module. Under the _Module template_ we want to put the url that leads towards a GitHub
repository where we saved our configuration files. For the sake of this tutorial we will be using our own 
[repository](https://github.com/cyclops-ui/templates) (`https://github.com/cyclops-ui/templates/tree/main/demo`) which holds a configuration template we made for testing purposes.
Feel free to use our template repository! We will be using the _demo_ template from the repository.

![Filled Module Template](../../../static/img/demo/module_template.png?raw=true "Filled Module Template")

The left field should be the root folder of your repository, while the right field should be the path towards the
template directory. After populating the fields, click load and if you filled the fields correctly, there will be a success 
message at the top of the screen and you will receive new fields to fill.

![Successfully loaded template](../../../static/img/demo/template_load_success.png?raw=true "Successfully loaded template")

Now all that's left to do is fill the form with values!
Here is an example of values you could use:

    Module name: demo
    name: demo-1
    replicas: 3,
    image: nginx,
    version: 1.14.2
    service: true

Now click save and you should see your new module listed!

![Listed Module](../../../static/img/demo/module_listed.png?raw=true "Listed Module")

## Potential problems
### Error loading template
This usually means that you didn't input the right `url + path`. When loading the template to Cyclops, you need to copy
the URL from the GitHub repository that leads to the template. The URL must lead towards a directory that holds a 
`template` folder.

In our example we used this URL { https://github.com/cyclops-ui/templates/tree/main/demo } and filled
the form with the values bellow:
    
    repository: https://github.com/cyclops-ui/templates
    path: demo    

### Naming
If Cyclops seemingly freezes when trying to save the module, it probably means you didn't follow [the Kubernetes naming
convention](https://kubernetes.io/docs/concepts/overview/working-with-objects/names/).

1. [x] contain no more than 253 characters
2. [x] contain only **lowercase** alphanumeric characters, '-' or '. '
3. [x] start with an alphanumeric character
4. [x] end with an alphanumeric character

### Contact info@cyclops-ui.com
If you have any problems with following the tutorial or the application itself, please contact us and we will reply as
soon as possible!