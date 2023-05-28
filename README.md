<img width="25%" alt="Screenshot 2022-04-03 at 21 48 18" src="https://user-images.githubusercontent.com/72022639/162230553-e669e572-1346-4289-814b-bd23d5b2d100.png">

# cyclops

Cyclops is a Kubernetes cluster management tool. It provides you with a handy UI that helps you manage your applications
inside the cluster and makes it easier for you to track your cluster's state. Once installed, cyclops 
will allow you to deploy, edit, scale, rollback, and delete all types of resources Kubernetes has to offer. While 
making actions on your cluster easier, it helps you with the observability of
your cluster and applications by grouping meaningful resources and enabling you to observe all applications resources at
once.

The main benefit of using cyclops is for your engineers not to maintain their application's configurations through the helm
templates, kustomize, or raw Kubernetes manifests, but to give them a UI they can use to alter their applications.

The intended flow of using cyclops is defining an application template that will be used as a form that contains fields 
needed for the application to work as expected.

A cyclops template contains a helm template and fields needed to populate that template. Now you are probably asking how
is this better than just using helm templates in the first place. When using cyclops you can define that helm template 
and its fields only once and it can be done by one person, instead of making your engineers get familiar with helm and 
Kubernetes. Engineers using your template to deploy their applications will only have an HTML form where they easily 
just populate fields that were already configured. Let's look at an example.

Let's say your team needs to deploy multiple REST APIs with similar configurations. That sounds like a great use case
for some already well-known templating tools like helm. Unfortunately, engineers in your team come from different 
backgrounds, and making them learn ins and outs of kubernetes might be time consuming. Instead, you
define a cyclops template that suits all of their services by defining fields they will be able to edit and a helm 
template those fields values will be injected to.

<p float="left">
<img width="45%" alt="Screenshot 2022-04-03 at 21 48 18" src="https://user-images.githubusercontent.com/72022639/161443376-f980ebee-0537-4a8a-9a38-18387c114ec4.png">
<img width="45%" alt="Screenshot 2022-04-03 at 21 48 30" src="https://user-images.githubusercontent.com/72022639/161443377-b3935a98-ac3d-41dc-9a51-285f51259627.png">
</p>

Now, your engineers can deploy their services by filling out an HTML form rendered based on the configuration you 
defined.

<img width="60%" alt="Screenshot 2022-04-03 at 22 00 13" src="https://user-images.githubusercontent.com/72022639/161443742-2e491ebd-1899-4d6e-b547-8a51b6ea4b2d.png">

After deploying a service this way, it is possible to edit it by using the same form, only this time it is 
prepopulated with the values cyclops found in the live deployment running inside your cluster.

![Screenshot 2022-04-06 at 20 26 17](https://user-images.githubusercontent.com/72022639/162033638-845b5f2c-f1df-4e17-b2fc-ba4ab318f887.png)
 
# Usage
Checkout currently deployed applications in your cluster. Browse through multiple namespaces at once. To deploy
a new service fill out the predefined form and hit OK. Cyclops will create a YAML definition of your K8s resource that
you can edit. If everything went smoothly you will be able to checkout details of your application through cyclops.

https://user-images.githubusercontent.com/72022639/159176264-beb7d796-831a-475a-867d-96988b3099eb.mov

Once you have your application up and running, you will eventually want to make changes to your applications. You can do
that easily through the same form you edited when deploying it for the first time. Make changes you wanted to make and
check produced manifest. If there is still something you would like to change, you can make those changes on the
produced manifest. Your changes are visible in the diff tab on the bottom of the popup screen. Besides your changes, you
can see that there is a diff in `annotations`, but that shouldn't worry you. It is just a way for cyclops to keep track
of deployed versions. Once you think you are ready with a new version hit OK and watch your change rollout.

https://user-images.githubusercontent.com/72022639/159176109-22e36dbb-308a-4909-ada4-ea8cc92f4025.mov

So you released a new version of your service, but it introduced a bug and you need to revert those changes ASAP.
Cyclops gives you a history of your services and allows you to rollback to any version of your service deployed through
cyclops.

https://user-images.githubusercontent.com/72022639/159176486-359ef95f-26f6-40cf-aa59-a3719a66dc1a.mov

And finally, you might want to delete a deployment. Feel free to do it through cyclops.

https://user-images.githubusercontent.com/72022639/159176508-a3e98531-a63d-42b7-894e-c52fb9397649.mov

# Deploy to cluster

Cyclops contains of cyclops UI and cyclops controller that handles requests and
applies changes or fetches information from the cluster. In order for cyclops to operate inside you cluster
you will need to deploy both of those.

Be aware that the next steps are intended for your local setup (minikube). In order to set up cyclops for your production
environment, you will need to make some tweaks to given configuration. Nevertheless, this should give you a good 
insight into what components make cyclops and give you an idea on how to deploy them for your needs.


1. Inside the cyclops repository you can find a 
    [yaml definition](https://github.com/petar-cvit/cyclops/blob/main/install/cyclops.yaml) of cyclops services. You can
    apply this manifest by running

    `kubectl apply -f https://raw.githubusercontent.com/petar-cvit/cyclops/main/install/cyclops.yaml`

    You can notice that cyclops is deployed inside kube-system namespace. This is done in order for cyclops controller  to have access your cluster's resources and to
    be able to manage them. Additionaly, cyclops-ctrl deployment has a sidecar container for a MongoDB instance which it
    uses for storing application history and application templates.

2. After you have applied the manifest from the cyclops repo, you can check if your cyclops pods are working as
   expected by running this command.

   `kubectl get deployment cyclops-ctrl -n kube-system`

    and

   `kubectl get deployment cyclops-ui -n kube-system`

3. Now that you are certain that cyclops is running, you can port-forward cyclops controller.

   `kubectl port-forward cyclops-ctrl-<pod-hash> 8080:8080 -n kube-system`

   Now, you can curl the cyclops backend API:

   `curl http://localhost:8080/namespaces`

4. Do the same thing for the cyclops UI:

   `kubectl port-forward cyclops-UI-<pod-hash> 3000:3000 -n kube-system`

5. Now you can try visiting http://localhost:3000 in your browser and try cyclops for yourself

# Open questions

* Initial version supporting only deployments observability
* Better handling of cyclops annotations
* Error handling
* Customizable details page
* Kubernetes CRD enabling you to group whichever resources you want https://github.com/petar-cvit/cyclops/blob/main/install/cyclops-module.yaml

# Run cyclops locally

- make sure docker daemon is running
- cd to cyclops-ui in terminal
- run `npm start`
- in another terminal tab run `minikube start`
- apply the Cyclops CRDs to the Kubernetes cluster `kubectl apply -f <path to cyclops root/>install/CRDs/cyclops-module.yaml`
- in another terminal tab from that one cd into cyclops-ctrl and run `make local-redis` to spin up a local redis instance through docker compose
- in the same tab as the previous step run `export PORT=8888` to expose backend to that port (its hardcoded in FE)
- in the same tab run `make start`
- go to `http://localhost:3000` in your browser 
