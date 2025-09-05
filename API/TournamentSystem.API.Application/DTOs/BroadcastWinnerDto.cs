using System.ComponentModel.DataAnnotations;

namespace UmaMusumeTournamentMaker.API.Application.DTOs
{
    public record BroadcastWinnerDto
    {
        [Required]
        public int TournamentId { get; init; }

        [Required]
        public int MatchId { get; init; }

        [Required]
        public int WinnerId { get; init; }
    }
}