interface ICredential {
  readonly credential_name: string;
  readonly credential_type: string;
  readonly credential_material: IBasicAuthCredentialMaterial | IAWSIAMCredentialMaterial;
}

interface IBasicAuthCredentialMaterial {
  readonly user_name: string;
  readonly password: string;
}

interface IAWSIAMCredentialMaterial {
  readonly encrypted_aws_iam_credential: string;
}

export { ICredential, IBasicAuthCredentialMaterial, IAWSIAMCredentialMaterial };