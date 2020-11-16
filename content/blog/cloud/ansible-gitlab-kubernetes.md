---
title: 'Adding Kubernetes Clusters to GitLab Instances using Ansible'
date: 2020-11-16 19:11:57
draft: false
tags : [ansible, gitlab, kubernetes]
---

Hey there,

I wanted to quickly share an automation step that you might want to find useful in your Ansible Playbooks. 
It's about adding a Kubernetes cluster to a Gitlab instance (eg installed via Omnibus) using Ansible. 

[The documentation tells you about a lot of manual steps](https://docs.gitlab.com/ee/user/project/clusters/add_remove_clusters.html#existing-kubernetes-cluster) to do it, but one can also do it via the API and a couple of shell scripts in Ansible. 

## Prerequisites

You need only two things: 

* `kubectl` should be installed and ready to talk with the Kubernetes cluster you want to integrate
* the Gitlab API should be available under a valid domain name, although localhost:port would also work

## Overview

Effectively it's a four step process:

1. add a new admin token to the instance (can be skipped if already exists)
2. adding the service account and cluster role bindings to the K8s cluster
3. retrieve the k8s api url, certificate and token
4. register using the gitlab API

## Ansible Script

Before we start, it needs two files to run: namely `gitlab-admin-service-account.yaml` and `gitlab_add_k8s.j2` template.

The first looks like that, but can [ultimately come from the documentation](https://docs.gitlab.com/ee/user/project/clusters/add_remove_clusters.html#existing-kubernetes-cluster):

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: gitlab
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1beta1
kind: ClusterRoleBinding
metadata:
  name: gitlab-admin
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
  - kind: ServiceAccount
    name: gitlab
    namespace: kube-system
```

The latter just encodes the REST request body, which is akin to what is documented in the [API documentation](https://docs.gitlab.com/ee/api/project_clusters.html#add-existing-cluster-to-project):

```json
{
    "name":"cluster-name",
    "platform_kubernetes_attributes":{
       "api_url":"{{k8s_api_url.stdout}}", 
       "token":"{{k8s_gitlab_token.stdout}}",
       "ca_cert":"{{k8s_cert.stdout}}"
    }
 }
```

Here's the full script:  
```yaml
- name: integrate gitlab with kubernetes
  hosts: all
  become: true
  vars:
    gitlab_admin_token: 'SUPER_SeCuRE_P4SSWORD_1237'
    gitlab_url: "https://{{ gitlab_domain }}"
  tasks:
    - name: install railties
      apt:
        pkg: ruby-railties
    - name: add admin token
      become: true
      shell: |
          echo "token = User.find_by_username('root').personal_access_tokens.create(scopes: [:api, :sudo], name: 'Automation token'); token.set_token('{{ gitlab_admin_token }}'); token.save!" | gitlab-rails console --environment=production
    - name: store k8s api url
      shell: kubectl config view -o jsonpath='{.clusters[0].cluster.server}'
      register: k8s_api_url
    - name: add service account
      shell: kubectl apply -f gitlab-admin-service-account.yaml
    - name: set token secret
      shell: |
        SECRET_NAME=$(kubectl -n kube-system get secret -o name | grep gitlab)
        kubectl -n kube-system get ${SECRET_NAME} -o jsonpath="{['data']['token']}" | base64 -d
      register: k8s_gitlab_token
    - name: store k8s certificate
      shell: kubectl get secrets -o=name | xargs kubectl get -o jsonpath="{['data']['ca\.crt']}" | base64 -d | sed -E ':a;N;$!ba;s/\r{0,1}\n/\\n/g'
      register: k8s_cert
    - name: add k8s cluster to gitlab
      uri:
        url: "{{gitlab_url}}/api/v4/admin/clusters/add"
        method: POST
        body_format: json
        return_content: yes
        status_code: [201]
        headers:
          Private-Token: "{{ gitlab_admin_token }}"
          Accept: application/json
          Content-Type: application/json
        body: "{{ lookup('template', './gitlab_add_k8s.j2') }}"
```

The most notable aspect is really how to set the token, let's take a look at the script with proper Ruby formatting:

```ruby
token = User.find_by_username('root').personal_access_tokens.create(scopes: [:api, :sudo], name: 'Automation token'); 
token.set_token('{{ gitlab_admin_token }}'); 
token.save!
```

The whole thing you just pipe into the gitlab-rails console `gitlab-rails console --environment=production` to persist it in the database.


## Bonus: Localhost clusters

If you find yourself having the cluster running on the same host as the gitlab instance (eg for development purposes) you might find yourself hitting that error:

> gitlab Import url is blocked: "Requests to the local network are not allowed"

This is somewhat explained in this [GitLab issue](https://gitlab.com/gitlab-org/gitlab/-/issues/26845), the TL;DR; is that it's a security feature.

You can turn it off however, using the admin token we created above the Ansible script basically just becomes:

```yaml
- name: allow localhost communication
    uri:
    url: "{{gitlab_url}}/api/v4/application/settings?allow_local_requests_from_hooks_and_services=true"
    headers:
        Private-Token: "{{ gitlab_admin_token }}"
    method: PUT
```

Hope it helps!

Cheers,  
Thomas