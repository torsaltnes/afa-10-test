namespace GreenfieldArchitecture.Application.Profile.Contracts;

/// <summary>
/// Payload for updating an existing certificate entry.
/// </summary>
public sealed record UpdateCertificateRequest(
    string CertificateName,
    string IssuingOrganization,
    DateOnly DateEarned);
