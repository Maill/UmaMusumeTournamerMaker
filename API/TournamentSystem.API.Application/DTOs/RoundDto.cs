using System.ComponentModel.DataAnnotations;

namespace UmaMusumeTournamentMaker.API.Application.DTOs
{
    public record RoundDto
    {
        [Required]
        public int Id { get; init; }

        [Required]
        public int RoundNumber { get; init; }

        [Required]
        public DateTime CreatedAt { get; init; }

        [Required]
        public bool IsCompleted { get; init; }

        [Required]
        public string RoundType { get; init; } = "Regular"; // Regular, Tiebreaker, Final

        [Required]
        public List<MatchDto> Matches { get; init; } = new();
    }
}