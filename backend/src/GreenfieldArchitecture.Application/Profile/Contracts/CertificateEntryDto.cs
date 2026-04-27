namespace GreenfieldArchitecture.Application.Profile.Contracts;

/// <summary>
/// Read model for a single certificate entry.
/// </summary>
public sealed record CertificateEntryDto(
    Guid Id,
    string CertificateName,
    string IssuingOrganization,
    DateOnly DateEarned);
