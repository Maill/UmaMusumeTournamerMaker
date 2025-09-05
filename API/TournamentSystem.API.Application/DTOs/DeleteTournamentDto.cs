using System.ComponentModel.DataAnnotations;

namespace UmaMusumeTournamentMaker.API.Application.DTOs
{
    public record DeleteTournamentDto
    {
        [Required]
        public int TournamentId { get; init; }

        [Required]
        public string Password { get; init; } = string.Empty;
    }
}
