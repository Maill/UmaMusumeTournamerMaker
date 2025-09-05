using System.ComponentModel.DataAnnotations;

namespace UmaMusumeTournamentMaker.API.Application.DTOs
{
    public record MatchDto
    {
        [Required]
        public int Id { get; init; }

        [Required]
        public int RoundId { get; init; }

        [Required]
        public int? WinnerId { get; init; }

        [Required]
        public DateTime CreatedAt { get; init; }

        [Required]
        public DateTime? CompletedAt { get; init; }

        [Required]
        public List<PlayerDto> Players { get; init; } = new();

        [Required]
        public PlayerDto? Winner { get; init; }
    }
}