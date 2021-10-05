# @xoi/serverless-log-dumpster

**Serverless plugin that archives CloudWatch Log Groups before their deletion**

![npm Version badge](https://img.shields.io/npm/v/@xoi/serverless-log-dumpster)
![unit tests badge](https://img.shields.io/github/workflow/status/xoeye/serverless-log-dumpster/unit-test?label=unit%20tests)

## Usage

1. To use this serverless plugin, you must first install it as a dependency.

   Run `npm install --save-dev @xoi/serverless-log-dumpster` or `yarn add --dev @xoi/serverless-log-dumpster`

2. Create an S3 bucket in the **same region** in which you are deploying your project.
   Note that your bucket must include a bucket policy to allow CloudWatch to write to it.
   You may refer to the official [AWS documentation](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/S3ExportTasksConsole.html#S3PermissionsConsole)
   on how to do so or view the bucket policy below

   <details>
     <summary>Or click to expand bucket policy </summary>

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Action": "s3:GetBucketAcl",
         "Effect": "Allow",
         "Resource": "arn:aws:s3:::<REPLACE_WITH_BUCKET_NAME>",
         "Principal": { "Service": "logs.<REPLACE_WITH_REGION>.amazonaws.com" }
       },
       {
         "Action": "s3:PutObject",
         "Effect": "Allow",
         "Resource": "arn:aws:s3:::<REPLACE_WITH_BUCKET_NAME>/[OPTIONAL_PATH_PREFIX/]*",
         "Condition": { "StringEquals": { "s3:x-amz-acl": "bucket-owner-full-control" } },
         "Principal": { "Service": "logs.<REPLACE_WITH_REGION>.amazonaws.com" }
       }
     ]
   }
   ```

   </details>

3. Add the plugin to your `serverless.yml` and add its configuration properties

   ```yaml
   [...]
   region: us-east-2

   plugins:
     - @xoi/serverless-log-dumpster

   logDumpster:
     destinationBucketName: example-logdumpster-bucket
     # destinationPathPrefix: defaults to 'logdumpster'
   [...]
   ```

4. Continue using Serverless as you normally would!
   LogDumpster will take care of creating and awaiting log group export tasks for any
   log groups that will be removed as a result of updating the cloudformation stack.

5. In the event of plugin or bucket misconfiguration, LogDumpster will error out and prevent the deployment from continuing keeping your log groups intact.

## Configuration

All configuration is done in serverless.yml at the root level under the `logDumpster` property.

Here are the possible configuration options:
| Configuration Key | Required? | Default | Description |
| ----------------- | --------- | ------- | ------------|
| destinationBucketName | Yes | N/A | Name of the AWS S3 bucket to export logs to. Please note that logDumpster will **not** automatically create nor manage this bucket for you. Refer to the [Usage](#usage) section of the README for more information on how to configure this. |
| destinationPathPrefix | No | `logdumpster` | S3 path prefix for export tasks. A slash is automatically appended to the end so that the exports live in `s3://thebucket/prefix/log-group-name/<data>`

## Other useful information

LogDumpster looks at the raw CloudFormation template diff (deployed vs deploying) using [@aws-cdk/cloudformation-diff](https://www.npmjs.com/package/@aws-cdk/cloudformation-diff) for any
deletion, changes or replacement to `AWS::Logs::LogGroup` resources, regardless of their origin.
This means that it will export log groups before deletion for _any_ log group specified within the CloudFormation template,
even if it was created and deleted manually or is managed by another plugin.

## Contributing

We welcome all contributors with open arms! See [CONTRIBUTING.md](./CONTRIBUTING.md)
