Contribute to the Progress Telerik AppBuilder Command-Line Interface
===

*Help us improve the AppBuilder CLI*

[![Telerik AppBuilder](https://raw.github.com/Icenium/icenium-cli/release/ab-logo.png "Telerik AppBuilder")](http://www.telerik.com/appbuilder "The Telerik AppBuilder web site")

The AppBuilder CLI lets you build, test, deploy, and publish hybrid mobile apps for iOS, Android, and Windows Phone 8 from your favorite IDE or code editor. You can develop your projects locally from the convenience of your favorite code editor and run the command-line to test, build, deploy in the simulator or on devices, and publish your applications to the App Store or Google Play.

* [Report an Issue](#bug "Learn how to report an issue")
* [Request a Feature](#request "Learn how to submit a feature or improvement request")
* [Contribute to the Code Base](#contribute "Learn how to submit your own improvements to the code")

Report an Issue
===
If you find a bug in the source code or a mistake in the documentation, you can submit an issue to our <a href="https://github.com/Icenium/icenium-cli">GitHub Repository</a>.
Before you submit your issue, search the archive to check if a similar issues has been logged or addressed. This will let us focus on fixing issues and adding new features.
If your issue appears to be a bug, and hasn't been reported, open a new issue. To help us investigate your issue and respond in a timely manner, you can provide is with the following details.

* **Overview of the issue:** Provide a short description of the visible symptoms. If applicable, include error messages, screen shots, and stack traces.
* **Motivation for or use case:** Let us know how this particular issue affects your work.
* **Telerik AppBuilder version(s):** List the current version and build number of the CLI interface. You can get it by running `$ appbuilder --version`. Let us know if you have not observed this behavior in earlier versions and if you consider it a regression.
* **System configuration:** Provide us with relevant system configuration information such as operating system, network connection, proxy usage, etc. Let us know if you have been able to reproduce the issue on multiple setups.
* **Steps to reproduce:** If applicable, submit a step-by-step walkthrough of how to reproduce the issue.
* **Related issues:** If you discover a similar issue in our archive, give us a heads up - it might help us identify the culprit.
* **Suggest a fix:** You are welcome to suggest a bug fix or pinpoint the line of code or the commit that you believe has introduced the issue.

[Back to Top][1]

Request a Feature
===
You can request a new feature by submitting an issue with the *enhancement* label to our <a href="https://github.com/Icenium/icenium-cli">GitHub Repository</a>.
If you want to implement a new feature yourself, consider submitting it to the <a href="https://github.com/Icenium/icenium-cli">GitHub Repository</a> as a Pull Request.

[Back to Top][1]

Contribute to the Code Base
===
First, read our <a href="https://github.com/Icenium/icenium-cli/blob/master/for-developers.md">developers documentation</a>.

Before you submit a Pull Request, consider the following guidelines.

* Search <a href="https://github.com/Icenium/icenium-cli/pulls">GitHub</a> for an open or closed Pull Request that relates to your submission.
* Clone the repository.
```bash
    git clone git@github.com:Icenium/icenium-cli.git
```
* Initialize the submodule.
```bash
    git submodule init
```
* Fetch data from the submodule.
```bash
    git submodule update
```
* Make your changes in a new `git` branch. We use the <a href="http://nvie.com/posts/a-successful-git-branching-model/">Gitflow branching model</a> so you will have to branch from our master branch.
```bash
    git checkout -b my-fix-branch master
```
* Create your patch and include appropriate test cases.
* Build your changes locally.
```bash
    grunt
```
* Ensure all the tests pass.
```bash
    grunt ts:devall
    npm test
```
* Commit your changes and create a descriptive commit message (the commit message is used to generate release notes).
```bash
    git commit -a
```
* Push your branch to GitHub.
```bash
    git push origin my-fix-branch
```
* In GitHub, send a Pull Request to icenium-cli:master.
* If we suggest changes, you can modify your branch, rebase, and force a new push to your GitHub repository to update the Pull Request.
```bash
    git rebase master -i
    git push -f
```

That's it! Thank you for your contribution!

When the patch is reviewed and merged, you can safely delete your branch and pull the changes from the main (upstream) repository.

* Delete the remote branch on GitHub.
```bash
    git push origin --delete my-fix-branch
```
* Check out the master branch.
```bash
    git checkout master -f
```
* Delete the local branch.
```bash
    git branch -D my-fix-branch
```
* Update your master branch with the latest upstream version.
```
    git pull --ff upstream master
```

[Back to Top][1]

[1]: #contribute-to-the-telerik-appbuilder-command-line-interface
