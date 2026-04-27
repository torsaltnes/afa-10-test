namespace GreenfieldArchitecture.Domain.Profile;

/// <summary>
/// Represents one professional certificate owned by an employee.
/// </summary>
public sealed class CertificateEntry
{
    public Guid Id { get; init; }
    public string UserId { get; init; } = string.Empty;
    public string CertificateName { get; set; } = string.Empty;
    public string IssuingOrganization { get; set; } = string.Empty;
    public DateOnly DateEarned { get; set; }
}
