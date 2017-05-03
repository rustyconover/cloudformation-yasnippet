# ya-snippets for AWS CloudFormation

Are you tired of copy and pasting JSON schema when you want to write a CloudFormation template? Yes, me too.

AWS has decided to document the schema of CloudFormation here.

http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cfn-resource-specification.html

I decided to write a simple node.js script to change that specification into a collection of yasnippets.

If you don't want to run the generation script, just use the snippets directory directly in your .emacs.

```
(setq yas-snippet-dirs (append yas-snippet-dirs
                               '("~/Downloads/interesting-snippets")))
```

For these snippets to appear you must be using json-mode to edit the CloudFormation.
