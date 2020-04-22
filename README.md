# aws-sample-cicd-cdk-1
Sample code for implementing CI/CD with AWS CDK

## Requirements

To run this sample you will need

1. AWS Account
2. Docker and Docker Compose installed
3. Node and NPM installed
4. AWS CDK CLI installed

## Running Locally

To run the code locally, you can execute following command.

```bash
docker-compose up
```

To run the unit text, you can execute the following command after running the server above.

```bash
docker-compose exec web ./vendor/bin/phpunit
```

## Deploying

To deploy the infrastructure to AWS, you need to install the node dependencies first.

```bash
npm install
```

And then you can deploy using following command,

```bash
cdk deploy
```

## Cleaning Up

To avoid incurring cost after you finish with this code, destroy the created resources using the following

```bash
cdk destroy
```