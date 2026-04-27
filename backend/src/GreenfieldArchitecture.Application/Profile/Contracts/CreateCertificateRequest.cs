namespace GreenfieldArchitecture.Application.Profile.Contracts;

/// <summary>
/// Payload for creating a certificate entry.
/// </summary>
public sealed record CreateCertificateRequest(
    string CertificateName,
    string IssuingOrganization,
    DateOnly DateEarned);
