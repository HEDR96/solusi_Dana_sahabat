package com.solusidana.sahabat.ui.agents

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.solusidana.sahabat.data.Agent
import com.solusidana.sahabat.databinding.ItemAgentBinding

class AgentAdapter(
    private val onClick: (Agent) -> Unit
) : ListAdapter<Agent, AgentAdapter.VH>(DIFF) {

    inner class VH(private val b: ItemAgentBinding) : RecyclerView.ViewHolder(b.root) {
        fun bind(ag: Agent) {
            b.tvName.text   = ag.name
            b.tvCity.text   = ag.city ?: "-"
            b.tvPhone.text  = ag.phone ?: "-"
            b.tvStatus.text = if (ag.status == "aktif") "Aktif" else "Nonaktif"
            b.tvStatus.setTextColor(
                if (ag.status == "aktif") 0xFF22C55E.toInt() else 0xFFEF4444.toInt()
            )
            val total   = ag.totalBerkas ?: 0
            val approve = ag.totalApprove ?: 0
            b.tvStats.text = "Berkas: $total  |  Approve: $approve"
            b.tvAvatar.text = ag.name.take(1).uppercase()
            b.root.setOnClickListener { onClick(ag) }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) = VH(
        ItemAgentBinding.inflate(LayoutInflater.from(parent.context), parent, false)
    )

    override fun onBindViewHolder(holder: VH, position: Int) = holder.bind(getItem(position))

    companion object {
        val DIFF = object : DiffUtil.ItemCallback<Agent>() {
            override fun areItemsTheSame(o: Agent, n: Agent) = o.id == n.id
            override fun areContentsTheSame(o: Agent, n: Agent) = o == n
        }
    }
}
