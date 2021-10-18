# Contributing

## Project Scope

This plugin originates from an internal need at XOi Technologies and it is highly likely that your needs
may differ slightly from ours and that's okay, keep reading!

#### Feature Requests

As this project is worked on during company time, feature requests that do not add direct value to
our operations needs may receive a low internal priority and be deferred to the open source community for implementation.
With that being said, we still highly encourage you to use the issues section as a conversation portal!

#### Feedback and comments

We're still totally interested in hearing what you would do differently. As was mentioned above, feel
free to use the issues section as a forum for civilized discussion!

## Issues

Please report bugs using GitHub Issues. If possible, providing a `mocha` style unit
test is also greatly appreciated and might even speed up out response time.

## Pull Requests

#### Code style

- We use Prettier (and eslint-prettier) for code formatting
- We use ESLint for code linting
- We use `mocha` for running tests, `sinon` for mocks and spies, and Node's builtin `assert` module for assertion.
- We use Husky to manage a Git pre-commit hook that automatically runs `npm run lint-staged` to enforce all the above.
  Please run `yarn prepare` or `npm run prepare` or `yarn prepare` in order to install these hooks
  within this repository and minimize CI surprises.

- We try to aim for 100% coverage but don't like to play a numbers game.
  - Writing unit tests that increase code coverage but does not perform logical assertions is actually
    detrimental and gives us a falsified overview of our perceived test coverage.
  - Our current assertions are probably not perfect either! Don't hesitate to improve them.

## Runtime targets

We aim to provide excellent support for LTS releases of Node.js.
"Prehistoric" versions (Node 8, 10) as well as bleeding-edge releases may be too much work to support,
but you are free to fork and open a PR if you need support for something in particular,

## @aws-cdk/cloudformation-diff

We use AWS CDK's [cloudformation-diff](https://www.npmjs.com/package/@aws-cdk/cloudformation-diff) library
to detect changes between the currently deployed CloudFormation template and the template that is set to be
deployed.

The rationale behind the decision of using this as oppposed to cloudformation changesets is:

1. We believe the library is mature enough for this project's goal
2. We don't want this plugin to interfere with the actual deployment flow. That is:
   - It should be transparent to other SLS plugins, including things like `serverless-cloudformation-changesets`.
   - It should _not_ perform any _write_ actions against the AWS account unless the service is actively being deployed

**Note:** Despite the mention of `serverless-cloudformation-changesets`,
LogDumpster _may not work as you expect_ in conjunction with it simply due to the nature of the changesets plugin. LogDumpster
will create the export tasks at the time of `serverless deploy` being executed just fine but any logs created
between the time of the export and a human reviewing, approving and deploying the changeset would be lost.
