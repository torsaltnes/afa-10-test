using GreenfieldArchitecture.Application.Deviations.Contracts;
using GreenfieldArchitecture.Domain.Deviations;

namespace GreenfieldArchitecture.Application.Deviations.Mappings;

/// <summary>
/// Extension methods for mapping between deviation domain objects and DTOs.
/// </summary>
public static class DeviationMappings
{
    public static DeviationDto ToDto(this Deviation deviation) =>
        new(
            deviation.Id,
            deviation.Title,
            deviation.Description,
            deviation.Severity,
            deviation.Status,
            deviation.ReportedBy,
            deviation.ReportedAt,
            deviation.UpdatedAt);
}
