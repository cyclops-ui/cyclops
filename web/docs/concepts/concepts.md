# Core concepts

For the sake of the rest of the docs to be more clear, here are some Cyclops-specific terms that will be used:

<strong>Module</strong> - an umbrella for all the Kubernetes resources your application needs to work as expected. For 
example, your application might require a deployment, a service, and an ingress to do its job. All of those are 
abstracted under a Cyclops Module. <br /><br />


<strong>Template</strong> - each Module references a Template that maps values from the Module into a valid Kubernetes
manifest. <br /><br />

<strong>Template origin</strong> - templates can live on different places. You can store your templates as Helm charts,
on git, or even inside Cyclops. <br /><br />

<strong>Template version</strong> - a part of the template reference in each Module is the version of the template.
Templates can evolve and change over time, and in order to maintain changes in your system, you can reference different 
template versions in different Modules. <br /><br />
