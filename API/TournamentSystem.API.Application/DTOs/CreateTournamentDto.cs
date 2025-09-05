using System.ComponentModel.DataAnnotations;
using UmaMusumeTournamentMaker.API.Domain.Enums;

namespace UmaMusumeTournamentMaker.API.Application.DTOs
{
    public record CreateTournamentDto
    {
        [Required]
        public string Name { get; init; } = string.Empty;

        [Required]
        public TournamentType Type { get; init; }

        [Required]
        public string? Password { get; init; }
    }
}
