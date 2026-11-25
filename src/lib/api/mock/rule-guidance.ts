/**
 * Rule-level guidance shared by every finding of the same rule. In the real
 * product this comes from the rules engine. `cli` placeholders are filled
 * from the affected resource: {name}, {resourceId}, {region}.
 */
import { type FindingRisk, type Remediation } from '@/types/cspm'

type RuleGuidance = {
  risk: FindingRisk
  effort: NonNullable<Remediation['effort']>
  cli?: string
}

export const RULE_GUIDANCE: Record<string, RuleGuidance> = {
  'aws-s3-public-read': {
    risk: {
      whyItMatters:
        'Public buckets are the most common cause of cloud data leaks. Anyone who finds the bucket name can list or download its files without signing in.',
      attackScenario:
        'Automated scanners guess bucket names from your company and app names, then download everything they can read.',
      impacts: ['data_exposure'],
      exploitability: 'easy',
    },
    effort: 'minutes',
    cli: 'aws s3api put-public-access-block --bucket {name} --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true',
  },
  'aws-iam-root-mfa': {
    risk: {
      whyItMatters:
        'The root user can do anything, including closing the account and changing billing. A password alone is one phishing email away from a full takeover.',
      attackScenario:
        'An attacker phishes or reuses a leaked root password, signs in, locks you out and runs expensive resources or deletes data.',
      impacts: ['account_takeover', 'data_loss', 'service_disruption'],
      exploitability: 'moderate',
    },
    effort: 'minutes',
  },
  'aws-rds-public': {
    risk: {
      whyItMatters:
        'A database reachable from the internet is exposed to password guessing and to any unpatched engine vulnerability.',
      attackScenario:
        'Internet scanners find the open database port and try common or leaked credentials until one works.',
      impacts: ['data_exposure', 'data_loss'],
      exploitability: 'moderate',
    },
    effort: 'hours',
    cli: 'aws rds modify-db-instance --db-instance-identifier {name} --no-publicly-accessible --apply-immediately --region {region}',
  },
  'aws-sg-ssh-open': {
    risk: {
      whyItMatters:
        'SSH open to the whole internet invites constant brute-force attempts. One weak or leaked key gives a shell on your server.',
      attackScenario:
        'Bots try thousands of username and key combinations a day against every open port 22 they find.',
      impacts: ['account_takeover', 'lateral_movement'],
      exploitability: 'easy',
    },
    effort: 'minutes',
    cli: 'aws ec2 revoke-security-group-ingress --group-id {resourceId} --protocol tcp --port 22 --cidr 0.0.0.0/0 --region {region}',
  },
  'aws-sg-all-traffic-open': {
    risk: {
      whyItMatters:
        'Allowing every port from anywhere exposes admin, database and debug services that were never meant to be public.',
      attackScenario:
        'Port scans reveal every service on the instances in this group; attackers target whichever one is weakest.',
      impacts: ['account_takeover', 'lateral_movement', 'data_exposure'],
      exploitability: 'easy',
    },
    effort: 'minutes',
    cli: "aws ec2 revoke-security-group-ingress --group-id {resourceId} --ip-permissions 'IpProtocol=-1,IpRanges=[{CidrIp=0.0.0.0/0}]' --region {region}",
  },
  'aws-iam-admin-policy': {
    risk: {
      whyItMatters:
        'Anyone who can assume this role gets full control of the account. Unused admin roles are easy to forget and hard to monitor.',
      attackScenario:
        'An attacker who compromises any principal allowed to assume the role escalates straight to administrator.',
      impacts: ['account_takeover', 'lateral_movement'],
      exploitability: 'moderate',
    },
    effort: 'hours',
    cli: 'aws iam detach-role-policy --role-name {name} --policy-arn arn:aws:iam::aws:policy/AdministratorAccess',
  },
  'aws-iam-key-rotation': {
    risk: {
      whyItMatters:
        'The longer a key lives, the more places it has been copied to: CI logs, laptops, old repositories. Any copy works until the key is rotated.',
      attackScenario:
        'A key leaked in a public repository or build log is used to call AWS APIs with this user’s permissions.',
      impacts: ['account_takeover', 'data_exposure'],
      exploitability: 'moderate',
    },
    effort: 'hours',
    cli: 'aws iam create-access-key --user-name {name}',
  },
  'aws-rds-encryption': {
    risk: {
      whyItMatters:
        'Unencrypted storage and snapshots can be read by anyone who gets a copy, for example through a shared or leaked snapshot.',
      attackScenario:
        'A snapshot is accidentally shared with another account or made public, exposing the raw data.',
      impacts: ['data_exposure'],
      exploitability: 'hard',
    },
    effort: 'days',
    cli: 'aws rds copy-db-snapshot --source-db-snapshot-identifier <snapshot-id> --target-db-snapshot-identifier {name}-encrypted --kms-key-id alias/aws/rds --region {region}',
  },
  'aws-ec2-imdsv1': {
    risk: {
      whyItMatters:
        'IMDSv1 answers any request from the instance, so a web app bug that fetches URLs can be tricked into returning the instance’s AWS credentials.',
      attackScenario:
        'An attacker exploits an SSRF bug to read http://169.254.169.254 and steals the role credentials.',
      impacts: ['account_takeover', 'lateral_movement'],
      exploitability: 'moderate',
    },
    effort: 'minutes',
    cli: 'aws ec2 modify-instance-metadata-options --instance-id {resourceId} --http-tokens required --http-endpoint enabled --region {region}',
  },
  'aws-vpc-flow-logs': {
    risk: {
      whyItMatters:
        'Without flow logs there is no record of which IPs talked to your servers, so you cannot investigate or prove what happened after an incident.',
      attackScenario:
        'Data is exfiltrated over the network and there is no evidence of where it went.',
      impacts: ['audit_gap'],
      exploitability: 'hard',
    },
    effort: 'minutes',
    cli: 'aws ec2 create-flow-logs --resource-type VPC --resource-ids {resourceId} --traffic-type REJECT --log-destination-type cloud-watch-logs --log-group-name vpc-flow-logs --deliver-logs-permission-arn <flow-logs-role-arn> --region {region}',
  },
  'aws-iam-password-policy': {
    risk: {
      whyItMatters:
        'Short, reusable passwords are cracked or guessed far more easily, especially when people reuse them across sites.',
      attackScenario:
        'Passwords leaked from another website are tried against your AWS console sign-in.',
      impacts: ['account_takeover'],
      exploitability: 'moderate',
    },
    effort: 'minutes',
    cli: 'aws iam update-account-password-policy --minimum-password-length 14 --password-reuse-prevention 24 --require-symbols --require-numbers --require-uppercase-characters --require-lowercase-characters',
  },
  'aws-ebs-encryption': {
    risk: {
      whyItMatters:
        'Unencrypted volumes and their snapshots can be read by anyone who gets a copy.',
      attackScenario:
        'A snapshot is shared with the wrong account, exposing everything on the disk.',
      impacts: ['data_exposure'],
      exploitability: 'hard',
    },
    effort: 'hours',
    cli: 'aws ec2 enable-ebs-encryption-by-default --region {region}',
  },
  'aws-s3-versioning': {
    risk: {
      whyItMatters:
        'Without versioning, a deleted or overwritten file is gone for good, whether by mistake or by ransomware.',
      attackScenario:
        'Stolen credentials are used to overwrite or delete backups before a ransom demand.',
      impacts: ['data_loss'],
      exploitability: 'hard',
    },
    effort: 'minutes',
    cli: 'aws s3api put-bucket-versioning --bucket {name} --versioning-configuration Status=Enabled',
  },
  'aws-s3-access-logging': {
    risk: {
      whyItMatters:
        'Without access logs you cannot tell who downloaded which files, which matters for investigations and some audits.',
      attackScenario:
        'Data is scraped from the bucket and there is no record of it.',
      impacts: ['audit_gap'],
      exploitability: 'hard',
    },
    effort: 'minutes',
    cli: `aws s3api put-bucket-logging --bucket {name} --bucket-logging-status '{"LoggingEnabled":{"TargetBucket":"acme-app-logs","TargetPrefix":"{name}/"}}'`,
  },
  'aws-ec2-public-ip': {
    risk: {
      whyItMatters:
        'Every public IP is another target. Staging servers are often less patched and monitored than production.',
      attackScenario:
        'An outdated staging app is found by a scanner and used as a foothold into the network.',
      impacts: ['lateral_movement'],
      exploitability: 'moderate',
    },
    effort: 'hours',
  },
  'aws-cloudtrail-enabled': {
    risk: {
      whyItMatters:
        'API calls in unmonitored regions leave no trace, which is exactly where attackers prefer to launch resources.',
      attackScenario:
        'Stolen keys are used to start crypto-mining instances in a region nobody watches.',
      impacts: ['audit_gap'],
      exploitability: 'hard',
    },
    effort: 'minutes',
    cli: 'aws cloudtrail update-trail --name <trail-name> --is-multi-region-trail',
  },
}
