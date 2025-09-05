using System.ComponentModel.DataAnnotations;

namespace UmaMusumeTournamentMaker.API.Application.DTOs
{
    public record PlayerDto
    {
        [Required]
        public int Id { get; init; }

        [Required]
        public string Name { get; init; } = string.Empty;

        [Required]
        public int Wins { get; init; }

        [Required]
        public int Losses { get; init; }

        [Required]
        public int Points { get; init; }

        [Required]
        public int RoundWins { get; init; }

        [Required]
        public int RoundLosses { get; init; }

        [Required]
        public string Group { get; init; } = string.Empty;

        [Required]
        public double WinRate { get; init; }

        [Required]
        public int TotalMatches { get; init; }

        [Required]
        public int RoundMatches { get; init; }
    }
}