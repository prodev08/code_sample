<?php

namespace Api;

use \Order;
use Carbon\Carbon;
use \Response;
use \Bestline\Order\Calculator;
use \Log;
use \Exception;

class FinalizedOrderController extends BaseController
{
    public function getIndex($orderId)
    {
        $order = Order::find($orderId);

        if(!$order instanceof Order) {
            Log::error("Could not find order with ID $orderId");
            return Response::json('Order not found', 404);
        }

        $order->load(
            'fabrics.type',
            'fabrics.fabric',
            'fabrics.options',
            'fabrics.options.data',
            'fabrics.options.option',
            'fabrics.options.subOption',
            'company',
            'contact',
            'contact.phoneNumbers',
            'contact.emails',
            'shippingAddress',
            'shippingMethod',
            'product',
            'product.ringType'
        );
        $order->sidetabs = $order->getSideTabsAttribute();
        $order->headerboard_cover_fabric = $order->getHeaderboardCoverFabricAttribute()->load('fabric')->toArray();
        $order->headerboard_cover_cut_length = $order->getHeaderboardCoverCutLengthTotalAttribute();

        //load orderLines and all data
        foreach($order->orderLines as $line){

            $line->load(
                'hardware',
                'cordPosition',
                'pullType',
                'mount',
                'options',
                'options.option',
                'options.subOption',
                'options.data',
                'options.orderFabric',
                'options.orderFabric.type',
                'options.orderFabric.fabric'
            );

            $line->total_panels = $line->getTotalPanelsAttribute();
            $line->skirt_height = $line->getSkirtHeightAttribute();
            $line->panel_height = $line->getPanelHeightAttribute();
            $line->ring_spacing = $line->getRingSpacingAttribute();
            $line->total_ring_columns = $line->getTotalRingColumnsAttribute();
            $line->headerboard_dimensions = $line->headerboard_dimensions; //load dimensions
            $line->headerboard_cover_fabric = $line->getHeaderboardCoverFabricAttribute()->load('fabric')->toArray();
            $line->headerboard_cover_cut_length = $line->getHeaderboardCoverCutLengthAttribute();
            $line->manufacturing_headerboard = $line->manufacturing_headerboard;
            $line->manufacturing_valance_headerboard = $line->manufacturing_valance_headerboard;
            $line->manufacturing_width = $line->getManufacturingWidthAttribute();
            $line->manufacturing_length = $line->getManufacturingLengthAttribute();
            $line->rod_dimensions = $line->getRodDimensions();
            $line->embellishment_option = $line->embellishment_option;
            if($line->embellishment_option){
                $line->embellishment_option->cuttings = $line->embellishment_option->cuttings;
                $line->embellishment_option->shape = $line->embellishment_option->shape;
                $line->embellishment_option = $line->embellishment_option->toArray();
            }
            $line->assembler_notes = $line->assembler_notes;
            $line->embellisher_notes = $line->embellisher_notes;
            $line->seamstress_notes = $line->seamstress_notes;

            //get fabric cuts
            $lineFabrics = $order->fabrics;
            foreach($lineFabrics as $lineFabric){

                $lineFabric->cuts = $line->getFabricCuts($lineFabric);
                $lineFabric->cut_length = $line->getFabricCutLength($lineFabric);
                $lineFabric->load('fabric');
                $lineFabric->fabric->quantity = $lineFabric->fabric->getQuantityAttribute();
            }
            $line->fabrics = $order->fabrics->toArray();
        }

        $order->date_due = Carbon::createFromFormat('Y-m-d', $order->date_due);
        $order->date_received = Carbon::createFromFormat('Y-m-d', $order->date_received);

        return Response::json($order->toArray());
    }
    public function unfinalize($orderId){

        $order = Order::find($orderId);

        try {
            if($order->finalized){
                $order->finalized->delete();
                $order->current_station_id = null;
            }
            foreach($order->orderLines as $orderLine){
                if($orderLine->finalized){
                    $orderLine->finalized->delete();
                    $orderLine->current_station_id = null;
                    $orderLine->save();
                }
                foreach($orderLine->options as $option){
                    if($option->final_price){
                        $option->final_price = null;
                        $option->save();
                    }
                }
            }
            $order->save();
        } catch(Exception $e) {
            return Response::json(array('error' => array('message' => $e->getMessage(), 'trace' => $e->getTrace())), 422);
        }

        $order->finalized = null;

        return Response::json($order->toArray());
    }
    public function getOrderForLabels($orderId)
    {
        $order = Order::find($orderId);

        if(!$order instanceof Order) {
            return Response::json(array('error' => array('message' => 'Order not found')), 404);
        }

        $order->load(
            'product',
            'company'
        );
        $order->company->shipping_address = $order->company->shipping_address;

        //load orderLines and all data
        foreach($order->orderLines as $line){

            $line->load(
                'cordPosition'
            );
        }

        return Response::json($order);
    }
}