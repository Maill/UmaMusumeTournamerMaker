using System.ComponentModel.DataAnnotations;

namespace UmaMusumeTournamentMaker.API.Application.DTOs
{
    public record UpdateTournamentDto
    {
        [Required]
        public int TournamentId { get; init; }

        [Required]
        public string Name { get; init; } = string.Empty;

        [Required]
        public string Password { get; init; } = string.Empty;
    }
}
